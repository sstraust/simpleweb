# SimpleWeb
An Emacs package that **simplifies web pages**, so they **render correctly** in the **<ins>Emacs Web Browser</ins>**

![Example Results](https://github.com/sstraust/simpleweb/blob/master/DemoScreenshot.png)

## Why Do I Need This?

Emacs is a text-based editor, but the modern web isn't very text-based. Javascript, visual applications, it's all too much and I don't like it.

This package uses machine learning to translate modern HTML into the much older style of the 1990s. _Simple_ HTML with _simple_, well labeled tags, that load well in the emacs browser.

## Installation
There are two ways to use this repository -- program generation mode (recommended), and a la carte mode.

### Program Generation Mode
#### Clone The Repository
```
mkdir -p ~/.emacs.d && cd $_
git clone https://github.com/sstraust/simpleweb.git
```
#### Make sure Claude CLI is available, and set the CLI path
(setenv "CLAUDE_CLI_PATH" "path to your claude")

you will also need to install firefox and [geckodriver](https://github.com/mozilla/geckodriver/releases)

#### Turn on the Library
Add the following to your .emacs file:
```
(add-to-list 'load-path "~/.emacs.d/simpleweb")
(require 'simpleweb-process-url)
(simpleweb-initialize-program-generation)
```

### A La Carte Mode
#### Clone The Repository
```
mkdir -p ~/.emacs.d && cd $_
git clone https://github.com/sstraust/simpleweb.git
```
#### Install Python Dependencies
```
sudo apt install python3-pip
pip install openai
pip install google-generativeai
pip install --upgrade requests
```
#### Add your GEMINI API key
```
(setenv "GEMINI_API_KEY" "your_api_key")
```
to your .emacs file
#### Turn on the Library
Add the following to your .emacs file:
```
(add-to-list 'load-path "~/.emacs.d/simpleweb")
(require 'simpleweb-process-url)
(simpleweb-initialize)
```


### Program Generation Mode vs. A La Carte Mode
There's two ways you can use this library, and it works like this:
- In *a la carte mode*, it sends the entire text of the webpage to an LLM, and asks it to generate the entire webpage in response.
- In *program generation mode* when you visit a new type of page, we generate a javascript *program* that does the simplification. Then, if you visit a similar page later, it'll used the cached program, rather than making a new LLM request.


In general, program generation takes a long time initially, but is much faster in the long run. By default, the process of generating programs runs in the background, so that it does not block your browsing experience (i.e. if no modifier program exists, we load the page as-normal, and then create a new modifier program in the background).

Program generation relies on the browser's default sandboxing to run the LLM generated code.

#### Which should I pick?
In general, program generation mode is best when you visit the same kinds of sites frequently (i.e. Clojure docs pages), and a. la. carte mode is best when every site is different (i.e. browsing random links from HN).

### Warnings

- This uses a lot of tokens, at least initially, to generate the pages. It's recommended that you use a subscription plan or something with a reasonable cap if you turn on this feature.
- This works by sending the full webpage text to an LLM, and does the modifications by injecting js into a firefox browser. It relies on browser sandboxing, which I am happy with, but I'd warn against using it with anything that contains logged-in information/secrets/etc.
- It runs with the claude CLI, so make sure you're happy with calling the claude CLI. I plan to add more models/options in the future.
- It takes a moment for the webserver to start up after you first open emacs. You may need to wait 10 seconds after you first open emacs to be able to start browsing.

Notes on program-generation mode:
- Modifications do not take effect the first time you visit a new type of page. If there isn't a modifier already generated, we load the page as-normal, and then use a background queue to generate the modifier program. We do this because it takes a long time for the program to generate. The next time you visit the page after generation, the changes should take effect.
- This spins up 2 firefox drivers, 1 for live browsing, and 1 for program generation. You can look at them to see what they are doing, but if you close them it will mess things up.
- Each generated program lives in simpleweb/generated_programs. If there's something you don't like, you can always delete it and regenerate it. It's sometimes worth iterating a few times for sites you frequently visit.

If you don't want to turn it on for every load, you can use the command ```simpleweb-simplify-page``` from inside a eww buffer insted.

### Additional Commands and Configuration
#### simpleweb-simplify-page
If you don't want to turn this on for every request, you can call ```simpleweb-simplify-page```, to load the simplification for only one specific webpage.

By default, this uses program-generation, if it is already generated, and if not, it returns the original page, and kicks of program-generation in the background.

#### simpleweb-simplify-clear-program
Delete the program used to modify this page.


#### simpleweb-modifier-program-directories
Customizable var. A list of directories to use when running in program generation mode.



#### Debugging
debugging: if things don't happen the way you expect them to
check the ```*Messages*``` and the ```*simplify-web-server*``` buffer.

This is a new feature that's still a little unpolished, so feel free to reach out directly if you have any problems getting it up and running.



### Changelog
- 8/23/26 add toggle for on-off, as well as command to one-shot run.
- 8/12/26 add tooling for program generation
