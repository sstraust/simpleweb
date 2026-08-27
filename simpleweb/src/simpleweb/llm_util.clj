(ns simpleweb.llm-util
  (:require [clojure.java.shell :as shell]))

(def curr-llm-model (atom ::claude-cli))

(defmulti llm-chat (fn [prompt & options] @curr-llm-model))

(defmethod llm-chat ::claude-cli
  [prompt & options]
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


(def llm-chat-gemini
  (delay (requiring-resolve 'simpleweb.gemini-chat/llm-chat-gemini)))

(defmethod llm-chat ::gemini
  [prompt & {:as options}]
  (@llm-chat-gemini prompt options))
