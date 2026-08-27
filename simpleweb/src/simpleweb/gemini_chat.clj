(ns simpleweb.gemini-chat
  (:require [libpython-clj2.python :as py]
            [libpython-clj2.require :refer [require-python]]))

(require-python '[google.generativeai :as genai])
(genai/configure  :api_key (System/getenv "GEMINI_API_KEY"))
(def ^:private gemini-model (genai/GenerativeModel "models/gemini-2.7-flash"))


(defn llm-chat-gemini
  [prompt & {:keys [model-name]}]
  (let [gemini-model (if model-name
                       (genai/GenerativeModel model-name)
                       gemini-model)
        model-output (py/py. gemini-model generate_content
                             [prompt])]
    (py/py.- model-output text)))
