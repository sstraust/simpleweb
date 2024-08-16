;;; -*- lexical-binding: t -*-
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
	(url-retrieve-synchronously "http://localhost:8131/simplifyURL")
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
  (request "http://localhost:8131/simplifyHTML"
    :data (list (cons "contents" html-contents))
    :sync t
    :type "POST"
    :parser 'buffer-string
    :success (cl-function
	      (lambda (&key data &allow-other-keys)
		(when data
		  (funcall callback data))))))

(defun simpleweb-simplify-html-advice-hook (start end)
  "Simplify the contents of a webpage in the current buffer."
  (let* ((html-contents (buffer-substring (point-min) (point-max)))
	 (active-buffer (current-buffer)))
    (simplify-html-page
     html-contents
     (lambda (simplified-html)
       (with-current-buffer active-buffer
	 (save-excursion 
	   (goto-char start)
	   (delete-region start end)
	   (insert simplified-html)))))))

;; (advice-add 'eww--preprocess-html :after #'simplify-html-advice-hook)
;; (advice-unadvice 'eww--preprocess-html)
