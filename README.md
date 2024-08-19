# SimpleWeb
Simpleweb is an Emacs package that **simplifies web pages**, so **they render correctly in the Emacs Web Browser**

## Why Do I Need This?

Emacs is a text-based editor, but the modern web isn't very text-based. Javascript, visual applications, it's all too much and I don't like it.

This package uses machine learning to translate modern HTML into the much older style of the 1990s. _Simple_ HTML with _simple_, well labeled tags, that load well in the emacs browser.

## Installation Instructions
#### Clone The Repository
```
git clone https://github.com/sstraust/simpleweb.git
```

#### Install Python Dependencies
```
sudo apt install python3-pip
pip install openai
pip install google-generativeai
pip install selenium
pip install --upgrade requests
```

#### Install Firefox and Gecko Driver
sudo apt install firefox
##### I had to do this workaround for ubuntu
https://askubuntu.com/questions/1399383/how-to-install-firefox-as-a-traditional-deb-package-without-snap-in-ubuntu-22

```
sudo snap remove firefox
sudo add-apt-repository ppa:mozillateam/ppa
echo '
Package: *
Pin: release o=LP-PPA-mozillateam
Pin-Priority: 1001

Package: firefox
Pin: version 1:1snap*
Pin-Priority: -1
' | sudo tee /etc/apt/preferences.d/mozilla-firefox
sudo apt install firefox
```

#### Add your GEMINI API key
add 
```
(setenv "GEMINI_API_KEY" "your_api_key")
```
to your .emacs file
#### Turn on the Library
Load ``` process_url.el```, and then call ``` (simpleweb-initialize) ``` from your .emacs file
