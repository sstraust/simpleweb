(ns simpleweb.compute-simple-page
  (:require [libpython-clj2.python :as py]
            [taoensso.tufte :as tufte :refer (p profile)]
            [libpython-clj2.require :refer [require-python]]))

(require-python 'openai)
(require-python '[google.generativeai :as genai])

(genai/configure  :api_key (System/getenv "GEMINI_API_KEY"))

(def ^:private gemini-model (genai/GenerativeModel "models/gemini-1.5-pro-latest"))


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


