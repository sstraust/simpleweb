;;; -*- lexical-binding: t -*-
(defcustom simpleweb-is-disabled nil
  "If true, simpleweb will be disabled even if it is initialized."
  :group 'simpleweb
  :type 'boolean)

(defun simpleweb-toggle-disabled ()
  (interactive)
  (setq simpleweb-is-disabled (not simpleweb-is-disabled)))

(defun simpleweb-preprocess-url (input-url)
  "Takes a URL as input, and returns a file location as output.

   The file contains the result of applying the simpleweb LLM on
   the contents of the URL. It's useful because the clojure webserver
   will load the URL in Selenium, which ~might~ be able to do more processing
   than the emacs web browser."
  (let ((url-request-method "POST")
	(url-request-extra-headers `(("Content-Type" . "application/x-www-form-urlencoded")))
	(url-request-data (concat "url=" input-url)))
    (with-current-buffer
	(url-retrieve-synchronously "http://localhost:8132/simplifyURL")
      (goto-char (point-min))
      (re-search-forward "^$")
      (delete-region (point) (point-min))
      (string-trim (buffer-string)))))


(defun simpleweb--create-test-page-outputs ()
  "Just a simple little util to grab test data
   (the HTML content of a webpage without anything applied)
   interactive development.

   Writes the output to simpleweb--test-html-data"
  (request "https://gptmafia.io"
    :params '()
    :parser 'buffer-string
    :success (cl-function (lambda (&key data &allow-other-keys)
			    (when data
			      (with-current-buffer (get-buffer-create "*request demo*")
				(erase-buffer)
				(setq simpleweb--test-html-data data)
				(insert data)
				(pop-to-buffer (current-buffer))))))))

(defun simpleweb--simplify-html-page (html-contents callback)
  "Simplify the contents of a webpage. This BLOCKS until the simplification returns.

   Takes a string representing an html response as input, and
   simplifies the HTML. 
   It uses a callback
   (simplified-html: String) --> Void
   to access the simplified HTML"
  (request "http://localhost:8132/simplifyHTML"
    :data (list (cons "contents" html-contents))
    :sync t
    :type "POST"
    :parser (lambda ()
	      (json-parse-buffer :object-type 'alist
				 :array-type 'list
				 :null-object nil
				 :false-object nil))
    :timeout 600
    :success (cl-function
	      (lambda (&key data &allow-other-keys)
		(when data
		  (funcall callback data))))))

(defun simpleweb--simplify-html-page-from-url (url callback)
  (simpleweb--simplify-html-page
   (or (plist-get eww-data :source)
       (buffer-substring-no-properties (point-min) (point-max)))
   callback))


(defun simpleweb-simplify-html-advice-hook (start end)
  "Simplify the contents of a webpage in the current buffer."
  (when (not simpleweb-is-disabled)
    (let* ((html-contents (buffer-substring (point-min) (point-max)))
	   (active-buffer (current-buffer)))
      (simpleweb--simplify-html-page
       html-contents
       (lambda (server-response)
	 (with-current-buffer active-buffer
	   (let ((simplified-html (alist-get 'modified-page-source server-response)))
	     (save-excursion 
	       (goto-char start)
	       (delete-region start end)
	       (insert simplified-html)))))))))


(defun simpleweb--simplify-html-page-scripting (url callback)
  "Simplify the contents of a webpage. This BLOCKS until the simplification returns.

   Takes a string representing an html response as input, and
   simplifies the HTML. 
   It uses a callback
   (simplified-html: String) --> Void
   to access the simplified HTML"
  (request "http://localhost:8132/simplifyWithScripting"
    :data (list (cons "url" url))
    :sync t
    :type "POST"
    :parser (lambda ()
	      (json-parse-buffer :object-type 'alist
				 :array-type 'list
				 :null-object nil
				 :false-object nil))
    :success (cl-function
	      (lambda (&key data &allow-other-keys)
		(when data
		  (funcall callback data))))))


(defun simpleweb--display-html-advice-helper (simplify-page-function orig charset url &rest args)
  (let ((target-buffer (current-buffer))
          (start (point)))
      (funcall simplify-page-function
       url
       (lambda (server-response)
	 (with-current-buffer target-buffer
           (when (alist-get 'modified-page-source server-response)
             (delete-region start (point-max))
             (goto-char start)
	     (let ((v (alist-get 'program-directory server-response))) 
	       (message "%S len=%d" v (length v)))
	     (when (alist-get 'program-directory server-response)
	       (insert (string-trim (alist-get 'program-directory server-response))))
             (insert (alist-get 'modified-page-source server-response))
	     (goto-char start))
           (apply orig charset url args))))))

(defun simpleweb--display-html-advice (orig charset url &rest args)
  (if simpleweb-is-disabled
      (apply orig charset url args)
    (apply #'simpleweb--display-html-advice-helper #'simpleweb--simplify-html-page-scripting orig charset url args)))


(defun simpleweb--get-simpleweb-jar-file ()
  (let* ((simpleweb-curr-filepath (find-lisp-object-file-name #'simpleweb-simplify-html-advice-hook 'defun)))
    (concat (file-name-directory simpleweb-curr-filepath)
	    "simpleweb/target/simpleweb.jar")))
(defun simpleweb--start-web-server ()
  (start-process "simplify-web process" "*simplify-web-server*"
		 "java" "-cp" (simpleweb--get-simpleweb-jar-file) "clojure.main" "-m" "simpleweb.core"))

(defun simpleweb-verify-eww-buffer ()
  (unless (derived-mode-p 'eww-mode) (user-error "Not in an eww buffer")))

(defun simpleweb--simplify-page-helper (simplification-method)
  (simpleweb-verify-eww-buffer)
  (if (not (get-buffer "*simplify-web-server*"))
      (progn (simpleweb--start-web-server)
	     (message "Starting simpleweb web server. It will take a moment to start up. RERUN THIS COMMAND in 10-15 seconds."))
    (let ((inhibit-read-only t))
      (goto-char (point-min))
      (simpleweb--display-html-advice-helper simplification-method #'eww-display-html 'utf-8 (eww-current-url)
					     nil (point-min) (current-buffer)))))

(defun simpleweb-simplify-page ()
  (interactive)
  (simpleweb--simplify-page-helper #'simpleweb--simplify-html-page-scripting))


(defun simpleweb-simplify-a-la-carte ()
  (interactive)
  (simpleweb--simplify-page-helper #'simpleweb--simplify-html-page-from-url))
  


(defun simpleweb-initialize ()
  (interactive)
  (simpleweb--start-web-server)
  (advice-add 'eww--preprocess-html :after #'simpleweb-simplify-html-advice-hook))

(defun simpleweb-initialize-program-generation ()
  (interactive)
  (simpleweb--start-web-server)
  (advice-add 'eww-display-html :around #'simpleweb--display-html-advice))





;; (advice-add 'eww--preprocess-html :after #'simplify-html-advice-hook)
;; (advice-unadvice 'eww--preprocess-html)
;; (advice-add 'eww-display-html :around #'simpleweb--display-html-advice)
;; (advice-unadvice 'eww-display-html)
;; eww--preprocess-html
;; (simpleweb-initialize-program-generation)
(provide 'simpleweb-process-url)
