(ns simpleweb.llm-util
  (:require [libpython-clj2.python :as py]
            [libpython-clj2.require :refer [require-python]]
            [clojure.java.shell :as shell]))

(def curr-llm-model (atom ::claude-cli))

(require-python '[google.generativeai :as genai])
(genai/configure  :api_key (System/getenv "GEMINI_API_KEY"))
(def ^:private gemini-model (genai/GenerativeModel "models/gemini-3.1-pro-preview"))

(defmulti llm-chat (fn [& args] @curr-llm-model))

(defmethod llm-chat ::claude-cli
  [prompt]
  (let [{:keys [exit out err]}
        (shell/sh (System/getenv "CLAUDE_CLI_PATH") "-p"
                  "--model" "opus"
                  "--output-format" "text"
                  
                  "--tools" ""
                  :in prompt          ; stdin — page sources are too big for argv
                  :out-enc "UTF-8")]  ; without this, non-ASCII comes back mangled
    (if (zero? exit)
      out         
      (throw (ex-info (str "claude failed: " err) {:exit exit})))))

(defmethod llm-chat ::gemini
  [prompt]
  (let [model-output (py/py. gemini-model generate_content
                             [prompt])]
    (py/py.- model-output text)))
