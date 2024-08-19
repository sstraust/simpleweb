(ns simpleweb.scratch)

(def MODE (atom :prod))

(require-python '[selenium.webdriver :as webdriver])
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

(System/getenv "PATH")

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

(defn- write-simplified-url [{{:keys [url]} :params}]
  {:status 200
   :headers {"Content-Type" "text/html"}
   :body (compute-simple-page/simplify-url url)})

;; (POST "/simplifyURL" params (write-simplified-url params))

