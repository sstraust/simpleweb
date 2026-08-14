# SimpleWeb
An Emacs package that **simplifies web pages**, so they **render correctly** in the **<ins>Emacs Web Browser</ins>**

![Example Results](https://github.com/sstraust/simpleweb/blob/master/DemoScreenshot.png)

## Why Do I Need This?

Emacs is a text-based editor, but the modern web isn't very text-based. Javascript, visual applications, it's all too much and I don't like it.

This package uses machine learning to translate modern HTML into the much older style of the 1990s. _Simple_ HTML with _simple_, well labeled tags, that load well in the emacs browser.


### New FEATURES
Hot off the press! you can't afford to miss these!

Instead of using raw LLMs to operate on a page's source, you can now generate a _program_ that operates on the page's source.

In practice, I've found this to be both a faster browsing experience, and produce more accurate output. I had been planning to do this for a long time, but only recently found that the current class of models were producing good enough output.


Warnings:
- This uses a lot of tokens, at least initially, to generate the pages. It's recommended that you use a subscription plan or something with a reasonable cap if you turn on this feature.
- This works by sending the full webpage text to an LLM, and does the modifications by injecting js into a firefox browser. It relies on browser sandboxing, which I am happy with, but I'd warn against using it with anything that contains logged-in information/secrets/etc.
- It runs with the claude CLI, so make sure you're happy with calling the claude CLI. I plan to add more models/options in the future.

Notes:
- The modifications do not take effect the first time you visit a new type of page. If there isn't a modifier already generated, we load the page as-normal, and then use a background queue to generate the modifier program. We do this because it takes a long time for the program to generate. The next time you visit the page after generation, the changes should take effect.
- This spins up 2 firefox drivers, 1 for live browsing, and 1 for program generation. You can look at them to see what they are doing, but if you close them it will mess things up.
- Each generated program lives in simpleweb/generated_programs. If there's something you don't like, you can always delete it and regenerate it. It's sometimes worth iterating a few times for sites you frequently visit.
- It takes a moment for the webserver to start up after you first open emacs. You may need to wait 10seconds after you first open emacs to be able to start browsing.
  


## Installation Instructions
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
(simpleweb-initialize)
```

### Use the library in program-generation mode
#### Make sure Claude CLI is available, and set the CLI path
(setenv "CLAUDE_CLI_PATH" "path to your claude")


Add the following to your .emacs file:
```
(add-to-list 'load-path "~/.emacs.d/simpleweb")
(simpleweb-initialize-program-generation)
```

you will also need firefox with geckodriver

debugging: if things don't happen the way you expect them to
check the ```*Messages*``` and the ```*simplify-web-server*``` buffer.

This is a new feature that's still a little unpolished/I haven't carefully written setup docs for it yet
so feel free to reach out directly if you have any problems getting it up and running.



### Changelog
- 8/12/26 add tooling for program generation
