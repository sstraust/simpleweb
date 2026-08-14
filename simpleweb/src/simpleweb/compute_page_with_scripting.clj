(ns simpleweb.compute-page-with-scripting
  (:require
   [clojure.java.io :as io]
   [clojure.string :as string]
   [etaoin.api :as et]
   [clojure.core.async :refer [chan sliding-buffer <!]]
   [simpleweb.llm-util :as llm-util]))

(def live-user-driver (delay (et/firefox)))

(def background-driver (delay (et/firefox)))
(def background-generate-modifier-queue (chan (sliding-buffer 10)))

(def generated-programs-base-dir "generated_programs")

(defn use-background-queue [] true)

(defn- simplify-page-program-prompt []
  (str "Act as a professional software engineer. Write a javascript program that converts the following HTML into a web 1.0 style website. It should keep the main page contents, and usability-wise should feel just the same as what you would see viewing it in the web browser. Everything after the text 'source code:\n' should be the program. It should be such that I can concatenate the original page source with the new javascript, and open it in a web browser.

Detailed instructions:
- If I create a regex matching 'source code:(.*)', it _MUST_ return executable javascript as plain text, with no script tag. IT ABSOLUTELY MUST BE PLAIN TEXT. IT SHOULD NOT INCLUDE EXTRA MARKINGS, AND MUST PIPE CLEANLY to a JS executor
- It should be a tool that specifically understands _this_ format of webpage, it does not need to work for all webpages
- It should preserve key page elements, like navigation, while keeping the result as simple and as human readable as possible
- It MUST retain all of the important content from the original page
- Organize it's contents so that it will display nicely in the emacs web browser, with the most important page elements at the top.
- If there is an extremely long toolbar  menu, show the first few items, and then fold the rest of it with a 'show more' button, so it doesn't take up the entire screen, but DO NOT cut off the main content or scrolling window.
- If the web page is organized this way, it should ideally show:
    - A short horizontal toolbar at the top, representing the main navigation options from this page
    - the main content of the page, typically a post or a list of articles, clearly delimeted, and with proper sectioning and spacing
    - in a section below, any relevant subcontent like a comments section or additional discussion
    - put spam or advertisements at the bottom of the page
    - make sure it will render correctly inside of eww view

:\n"))


(defn- simplify-page-matcher-program-prompt []
  (str "Act as a professional software engineer. Given to you is a javascript program (the modifier program) whose purpose is to modify a webpage (an example webpage is given below).

Given a new webpage, I want to determine whether the new page has the same layout as the provided example, such that the modifier program will provide similar results when applied to that webpage. Your main goal is to determine if the new page is the same _TYPE_ of page as the original example. Write me a JAVASCRIPT program that takes a webpage as input, and returns true if the modifier program is appropriately suited to modify this webpage. Everything after the text 'source code:\n' should be the program. It should be such that I can concatenate the original page source with the new javascript, and open it in a web browser.

Detailed instructions:
- If I create a regex matching 'source code:(.*)', it _MUST_ return executable javascript as plain text with no script tag. IT MUST BE IN EXACTLY THIS FORMAT, OTHERWISE THE PROGRAM INGESTING IT WILL BREAK.  IT ABSOLUTELY MUST BE PLAIN TEXT. IT SHOULD NOT INCLUDE EXTRA MARKINGS, AND MUST PIPE CLEANLY to a JS executor
- you should be highly cautious here, and only return true if you are very confident the modifer program will operate as-designed on the input to the js function
- The function MUST RETURN A VALUE with the result

:\n"))



(defn- extract-js-program [llm-output]
  (second (re-find #"(?is)source code:(.+)" llm-output)))


(defn- simplify-page-contents-program [page-source]
  (extract-js-program
   (llm-util/llm-chat (str (simplify-page-program-prompt) page-source))))

(defn- simplify-page-contents-matcher-program [page-source js-contents]
  (extract-js-program
   (llm-util/llm-chat (str (simplify-page-matcher-program-prompt) page-source js-contents))))

(defn- sanitize-to-filename [s]
  (string/replace s #"[^A-Za-z0-9_]" "_"))

(defn- sanitized-top-level-domain [url]
  (sanitize-to-filename (.getHost (java.net.URI. url))))

(defn- top-level-path [url]
  (io/file generated-programs-base-dir (sanitized-top-level-domain url)))

(defn- truncate [s size]
  (subs s 0 (min size (count s))))
  

(defn- sanitized-path [url]
  (truncate (sanitize-to-filename url) 150))

(defn- filter-first [pred x]
  (first (filter pred x)))

(defn matcher-matches? [driver matcher-file]
  (when (.exists matcher-file)
    (et/js-execute @driver (str "return " (string/trim (slurp matcher-file))))))

(defn lookup-modifier-program [best-matching-dir]
  (slurp (io/file best-matching-dir "modifier.js")))

  

(defn- write-matcher-program-to-disk [url matcher-program modifier-program]
  (let [top-level-path (top-level-path url)
        subpath (sanitized-path url)
        matcher-path (io/file top-level-path subpath "matcher.js")
        modifier-path (io/file top-level-path subpath "modifier.js")]
    (io/make-parents matcher-path)
    (spit matcher-path matcher-program)
    (spit modifier-path modifier-program)))


(defn- generate-new-program-for-source [url page-source]
  (let [modifier-program (simplify-page-contents-program page-source)
        matcher-program (simplify-page-contents-matcher-program
                         page-source modifier-program)]
    (write-matcher-program-to-disk url matcher-program modifier-program)
    modifier-program))

;; note that this assumes the file is pointed at the current URL. you should assert this
;; returns nil if no dir found
(defn- get-best-matching-modifier-program [url driver]
  (let [top-level-path (top-level-path url)
        subpath (sanitized-path url)
        
        ;; always look up the current path first
        dirs-to-lookup (concat [(io/file top-level-path subpath)]
                               (filter #(.isDirectory %)
                                       (.listFiles (io/file top-level-path))))
        
        best-matching-dir (filter-first (fn [x] (try
                                                  (matcher-matches?
                                                   driver
                                                   (io/file x "matcher.js"))
                                                  (catch Exception e false)))
                                        dirs-to-lookup)]
    (when best-matching-dir
      (lookup-modifier-program best-matching-dir))))

;; TODO rename main driver to something else
(defn process-background-queue [queue driver]
  (clojure.core.async/go-loop []
    (when-some [url (<! queue)]
      (try
        (et/go @driver url)
        (let [page-source (et/get-source @driver)]
          (when (not (get-best-matching-modifier-program url driver))
            (generate-new-program-for-source url page-source)))
        (catch Exception e
          (println e)
          nil))
      (recur))))
(def process-background-queue-once (memoize process-background-queue))



  
(defn simplify-url [url]
  (process-background-queue-once background-generate-modifier-queue background-driver)
  (et/go @live-user-driver url)
  (et/wait 0.15)
  (let [modifier-program (get-best-matching-modifier-program url live-user-driver)
        modifier-program (or modifier-program
                           (if (use-background-queue)
                             (do (clojure.core.async/offer! background-generate-modifier-queue url)
                                 "")
                             (generate-new-program-for-source url (et/get-source @live-user-driver))))]
    (et/js-execute @live-user-driver modifier-program)
    (et/wait 0.05)
    (et/get-source @live-user-driver)))
