# Token ATM Single-Page Application (SPA)

## Description

Project Name: Token ATM

This repository contains the Single-Page Application (SPA) for Token ATM. Most functionalities of Token ATM are implemented here (please check out the user manual for usage guideline). This SPA won't work with normal browsers due to the restriction of Same-Origin Policy (SOP), and it requires special configuration to test (See the Setup section for more information).

## Team Members

Cody Svozil, Katie Ren, Mingrui (Ray) Han, Xu (Carson) Wang, Yongkang (camerfoul) Man

## Setup

1. Install Node.js 18. Alternatively, you can also use [Dev Container Extension for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) (Docker is required to be installed) and use VSCode command `Dev Containers: Open Folder in Container...` to open this folder.
2. Install necessary dependencies using `npm install`.
3. Setup testing environment for this SPA (have web security and certificate error disabled or use token-atm-app):

    Although Firefox has some extensions that are related to disable SOP, they don’t work well with preflight requests. Thus, Chrome (or Chromium) is a better option since it supports disabling SOP and SSL certificates error with options. The following three options should be used:

    1. `--disable-web-security`: This option will disable web security functionality, which includes SOP.
    2. `--user-data-dir=<path>`: This option is required when `--disable-web-security` is used. `<path>` should be replaced by a file path that used to store the isolated Chrome profile.
    3. `--ignore-certificate-errors`: This option will ignore SSL certificate errors encountered. This option is needed since the self-hosted Canvas uses a self-signed certificate, which will cause an SSL error. This option enables token-atm-spa to interact with self-hosted Canvas. If you are using Canvas Free for Teacher instead, you could skip this option.

    Example: `chrome --disable-web-security --user-data-dir=./ --ignore-certificate-errors`

    Note: Depending on your operating system (Linux or Windows) and the way you have Google Chrome installed, you might need to change the executable path and/or the path format.

    For macOS, Google Chrome is needed. Here is the command to run a insecure Google Chrome on macOS:

    `open -na "Google Chrome" --args --disable-web-security --user-data-dir=<absolute path> --ignore-certificate-errors`

    Please replace `<absolute path>` with an absolute path to an empty directory created for the Chrome profile of this insecure Google Chrome.

    Alternatively, you can use token-atm-app for testing. Please follow the note in the Setup section of token-atm-app's README file to switch the SPA opened by the desktop application from the online GitHub version to the local version.

4. Host the SPA in development mode with `npm start`.
5. Access `http://localhost:4200` in the testing environment you setup in step 3.

## Build

After completing the first two steps of the Setup section, you could use `npm run build` to build the SPA. The output will be in the `dist` folder.

Note: Base href is configured as `/token-atm/` for the production configuration. As a result, if you want to access the SPA by hostinng the build output, you need to append `/token-atm/` to the URL. The SOP restriction still applies, so you need to access it from a testing environment described in step 3 of the Setup section.
