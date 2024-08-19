# SimpleWeb
An Emacs package that **simplifies web pages**, so they **render correctly** in the **<ins>Emacs Web Browser</ins>**

![Example Results](https://github.com/sstraust/simpleweb/blob/master/DemoScreenshot.png)

## Why Do I Need This?

Emacs is a text-based editor, but the modern web isn't very text-based. Javascript, visual applications, it's all too much and I don't like it.

This package uses machine learning to translate modern HTML into the much older style of the 1990s. _Simple_ HTML with _simple_, well labeled tags, that load well in the emacs browser.

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
