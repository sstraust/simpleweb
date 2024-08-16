(ns simpleweb.core
  (:require [compojure.core :refer [defroutes GET POST]]
            [ring.adapter.jetty :as ring]
            [hiccup.page :refer [include-js include-css html5]]
            [easyreagentserver.core :as er-server]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [ring.middleware.params :only [wrap-params] :refer [wrap-params]]
            [clojure.data.json :as json]
            [simpleweb.compute-simple-page :as compute-simple-page]))

(defn test-output [params]
  {:status 200
   :headers {"Content-Type" "text/html"}
   :body "Success!"})

(defn write-simplified-url [{{:keys [url]} :params}]
  {:status 200
   :headers {"Content-Type" "text/html"}
   :body (compute-simple-page/simplify-url url)})

(comment
  (compute-simple-page/simplify-page-contents "hi")
  )

(defn simplify-page-contents [{{:keys [contents]} :params}]
  (println "recieved request with content: " (count contents))
  (let [output (compute-simple-page/simplify-page-contents contents)]
    (println output)
    output)
  )
  

(defroutes routes
  (POST "/simplifyHTML" params (simplify-page-contents params))
  (POST "/simplifyURL" params (write-simplified-url params))
  (GET "/test" params (test-output params)))

(defonce web-server (atom nil))
(defn run-web-server []
  (when (not (nil? @web-server))
    (.stop @web-server))
  (reset! web-server (ring/run-jetty
                      (wrap-params (wrap-keyword-params routes))
                      {:port 8131
                       :join? false
                       :headerBufferSize 1048576})))

;; (run-web-server)
