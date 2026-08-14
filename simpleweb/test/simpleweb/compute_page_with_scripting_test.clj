(ns simpleweb.compute-page-with-scripting-test
  (:require [simpleweb.compute-page-with-scripting :refer :all]
            [babashka.fs :as fs]
            [clojure.test :refer :all]))

(def test-data-dir "test/tmp/simplewebtestdata")

(defn test-directory-fixture [f]
  (fs/delete-tree test-data-dir)
  (f))

(use-fixtures :each test-directory-fixture)



(deftest test-sanitized-path
  (testing "Test that sanitize path produces a reasonable file path"
    (is
     (=
      "https___www_reddit_com_r_landscaping_comments_1vksgg8_so_my_neighbor_isnt_thrilled_"
      (#'simpleweb.compute-page-with-scripting/sanitized-path
       "https://www.reddit.com/r/landscaping/comments/1vksgg8/so_my_neighbor_isnt_thrilled/")))))


(deftest test-top-level-domain
  (testing "Test that top level domain produces a reasonable path")
   (is
    (=
     "www_reddit_com"
     (#'simpleweb.compute-page-with-scripting/sanitized-top-level-domain
      "https://www.reddit.com/r/landscaping/comments/1vksgg8/so_my_neighbor_isnt_thrilled/"))))


(deftest write-to-disk-test
  (testing "Test that I can write to disk, and then read it later"
    (let [example-url "https://www.reddit.com"]
      ;; TODO use a proper DI framework
      (with-redefs [simpleweb.compute-page-with-scripting/generated-programs-base-dir test-data-dir
                    simpleweb.compute-page-with-scripting/matcher-matches? (fn [& args] true)]
        (#'simpleweb.compute-page-with-scripting/write-matcher-program-to-disk
         example-url "test_matcher_program" "test_modifier_program")
        (is (= (#'simpleweb.compute-page-with-scripting/get-best-matching-modifier-program
                example-url "unused-page-source")
               "test_modifier_program"))))))
