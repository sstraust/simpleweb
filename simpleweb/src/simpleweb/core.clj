(ns simpleweb.core
  (:require [compojure.core :refer [defroutes GET POST]]
            [ring.adapter.jetty :as ring]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [ring.middleware.params :only [wrap-params] :refer [wrap-params]]
            [simpleweb.compute-simple-page :as compute-simple-page])
  (:gen-class))


(defn- test-output [_]
  {:status 200
   :headers {"Content-Type" "text/html"}
   :body "Success!"})





(defn- simplify-page-contents [{{:keys [contents]} :params}]
  (try 
    (println "recieved request with content: " (count contents))
    (let [output (compute-simple-page/simplify-page-contents contents)]
      (println output)
      output)
    (catch Exception e
      (println "error!!: " e)
      {:status 500
       :headers {}
       :body (str "simplifyweb failed with exception " e)})))
  

(defroutes routes
  (POST "/simplifyHTML" params (simplify-page-contents params))
  (GET "/test" params (test-output params)))

(defonce ^:private web-server (atom nil))
(def ^:private port 8131)
(defn run-web-server []
  (when (not (nil? @web-server))
    (.stop @web-server))
  (reset! web-server (ring/run-jetty
                      (wrap-params (wrap-keyword-params routes))
                      {:port port
                       :join? false
                       :headerBufferSize 1048576}))
  (println "running server on port " (str port)))

(defn -main []
  (run-web-server))

;; (run-web-server)
