(ns simpleweb.core
  (:require [compojure.core :refer [defroutes GET POST]]
            [ring.adapter.jetty :as ring]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [ring.middleware.params :only [wrap-params] :refer [wrap-params]]
            [simpleweb.compute-page-with-scripting :as compute-page-with-scripting]
            [clojure.data.json :as json])
  (:gen-class))


(defn- test-output [_]
  {:status 200
   :headers {"Content-Type" "text/html"}
   :body "Success!"})



(def compute-simple-page-simplify
  (delay (requiring-resolve 'simpleweb.compute-simple-page/simplify-page-contents)))

(defn- simplify-page-contents [{{:keys [contents]} :params}]
  (try 
    (println "recieved request with content: " (count contents))
    (let [output (@compute-simple-page-simplify contents)]
      ;; (println output)
      (json/write-str {:modified-page-source output}))
    (catch Exception e
      (println "error!!: " e)
      {:status 500
       :headers {}
       :body (str "simplifyweb failed with exception " e)})))

(defn- simplify-with-scripting [{{:keys [url]} :params :as params}]
  (try
    (let [output (compute-page-with-scripting/simplify-url url)]
      (do ;; (println output)
          (json/write-str output)))
    (catch Exception e
      (println "error!!: " e)
      {:status 500
       :headers {}
       :body (str "simplifyweb failed with exception " e)})
  ))


  

(defroutes
 routes
 (POST "/simplifyHTML" params (simplify-page-contents params))
 (POST "/simplifyWithScripting" params (simplify-with-scripting params))
  (GET "/test" params (test-output params)))

(defonce ^:private web-server (atom nil))
(def ^:private port 8132)
(defn run-web-server []
  (when (not (nil? @web-server))
    (.stop @web-server))
  (reset! web-server (ring/run-jetty
                      (wrap-params (wrap-keyword-params routes))
                      {:port port
                       :join? false
                       :headerBufferSize 1048576}))
  (println "running server on port " (str port)))

(defn -main [file-path]
  (reset! compute-page-with-scripting/generated-programs-base-dir
          file-path)
  (run-web-server))

;; (run-web-server)
