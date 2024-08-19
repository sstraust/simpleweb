(ns simpleweb.compute-simple-page
  (:require [libpython-clj2.python :as py]
            [taoensso.tufte :as tufte :refer (p profile)]
            [libpython-clj2.require :refer [require-python]]))

(require-python 'openai)
(require-python '[google.generativeai :as genai])
(require-python '[selenium.webdriver :as webdriver])

(genai/configure  :api_key (System/getenv "GEMINI_API_KEY"))

(def ^:private gemini-model (genai/GenerativeModel "models/gemini-1.5-pro-latest"))

(def MODE (atom :prod))

(defn create-web-driver []
  (let [opts (webdriver/FirefoxOptions)
        profile (webdriver/FirefoxProfile)]
    (when (not (= @MODE :dev))
      (py/py. opts add_argument "--headless"))
    (py/set-attr! opts "profile" profile)
    (webdriver/Firefox :options opts)))

(def ^:private web-driver (create-web-driver))



(defn- get-page-source [url]
  (py/py. web-driver get url)
  (Thread/sleep 1200)
  (let [remove-scripts-js "
    var scripts = document.getElementsByTagName('script');
    while (scripts.length > 0) {
        scripts[0].parentNode.removeChild(scripts[0]);
    }"]
    (py/py. web-driver execute_script remove-scripts-js))
  (py/py.- web-driver page_source))

(defn- simplify-page-prompt []
  (str "Act as a professional software engineer. Convert the following HTML into a simpler html code that will be understandable by eww. Make sure you preserve all important forms, buttons, and information. There is no CSS, so make sure that elements are properly labeled (things that should be headers are h1, h2, h3, things that should be paragraphs have <p> tags, etc.). Focus on the content of the page, rather than headers or extraneous info. Return only the html contents of the site. Return it as raw text and do not quote the output:\n"))

(defn- rand-file-name []
  (str "resources/file_url" (rand-int 10000) (rand-int 10000) ".html"))

(defn- rand-file-id []
  (str "file_id" (rand-int 10000) (rand-int 10000)))

(defn simplify-page-contents [page-source]
  (profile
   {}
   (let [temp-file-name (rand-file-name)
         _ (spit temp-file-name  page-source)
         gemini-file (p :upload-file
                        (genai/upload_file
                         :path temp-file-name
                         :display_name (rand-file-id)))
         model-output (p :compute-model-output
                        (py/py. gemini-model generate_content
                                [(simplify-page-prompt) gemini-file]))]
     (p :retrieve-model-output (py/py.- model-output text)))))

;; (def simplify-page-contents (memoize simplify-page-contents))

(defn simplify-url [url]
  (let [page-source (get-page-source url)
        simple-contents (simplify-page-contents page-source)
        output-location (rand-file-name)]
    (spit output-location simple-contents)
    (.getAbsolutePath (java.io.File. output-location))))

(comment
  (def out1 (simplify-url "https://stackoverflow.com/questions/64110022/argument-list-too-long-error-when-passing-a-find-output-as-arguments"))
  (println out1)
  )
