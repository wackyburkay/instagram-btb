# Instagram: Block the Blocker

A browser extension that blocks an Instagram account that has already blocked you, using
your own logged-in Instagram session.

No servers and no copy-pasting cookies. Everything runs inside your Instagram tab.

## Install

The extension isn't on any extension store, so you load it into your browser yourself.
Pick one of the two options below.

<details>
<summary><b>Option 1: Download a ready-made package</b> (no code needed)</summary>

<br>

1. Go to the [latest release](https://github.com/wackyburkay/instagram-btb/releases/latest).
2. Under **Assets**, download the file for your browser:
   - `instagram-btb-<version>.zip` for Chrome, Edge, Brave and Opera
   - `instagram-btb-<version>.xpi` for Firefox, Floorp and other Firefox-based browsers
   - `instagram-btb-<version>-safari-app.zip` for Safari
3. Follow the steps for your browser below.

**Chrome, Edge, Brave**

1. Extract the `.zip` file to a folder you'll keep. The browser loads the extension from
   that folder, so don't delete it afterwards.
2. Open the extensions page: `chrome://extensions` (Chrome), `edge://extensions` (Edge) or
   `brave://extensions` (Brave).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder, the one with `manifest.json` in it.

**Opera**

1. Extract the `.zip` file to a folder you'll keep.
2. Go to `opera://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the extracted folder.

**Floorp**

1. Go to `about:addons`, click the gear icon, and choose **Install Add-on From File...**.
2. Select the `.xpi` file and confirm.
3. If Floorp refuses because the add-on isn't signed, go to `about:config`, set
   `xpinstall.signatures.required` to `false`, and try again. If it still refuses, use the
   temporary method under **Firefox** below.

**Firefox**

Regular Firefox only installs unsigned extensions temporarily. They are removed when you
close the browser, so you'll need to repeat this each time.

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...** and select the `.xpi` file.

Firefox Developer Edition, Nightly and ESR can install it permanently: set
`xpinstall.signatures.required` to `false` in `about:config`, then use the Floorp steps above.

**All Firefox-based browsers:** in `about:addons`, open the extension, go to **Permissions**,
and allow access to instagram.com, cdninstagram.com and fbcdn.net. The last two are
Instagram's image servers and are only used to show profile pictures in the popup.

**Safari (macOS)**

Safari extensions come inside a small Mac app. It isn't signed by Apple, so macOS and Safari
both ask you to allow it once.

1. Double-click `instagram-btb-<version>-safari-app.zip` to extract **Block the Blocker.app**,
   and move it to your **Applications** folder.
2. Open the app. macOS blocks it the first time because it isn't from an identified
   developer. Click **Done**, go to **System Settings > Privacy & Security**, scroll down to
   the message about Block the Blocker, click **Open Anyway**, and confirm. You can close the
   app once it opens.
3. In Safari, open **Settings > Advanced** and turn on **Show features for web developers**.
4. In the menu bar, choose **Develop > Allow Unsigned Extensions**. Safari turns this off
   every time it quits, so repeat this step after restarting Safari.
5. In **Settings > Extensions**, turn on **Block the Blocker**.
6. Open instagram.com, click the extension's icon in the toolbar, and choose
   **Always Allow on This Website**.

If you'd rather build the app yourself with Xcode, download
`instagram-btb-<version>-safari.zip` instead, extract it, and run
`python3 make_xcode_project.py` in that folder. It creates the Xcode project and opens it.
Then follow **Building and enabling it in Safari** under Option 2 below, from step 2.

</details>

<details>
<summary><b>Option 2: Load it from the source code</b> (for developers)</summary>

<br>

Clone the repository:

```sh
git clone https://github.com/wackyburkay/instagram-btb.git
```

Or download it with **Code > Download ZIP** on the repository page and extract it. The
extension's root is the folder that contains `manifest.json`. To update later, run
`git pull` and reload the extension.

**Chrome, Edge, Brave**

1. Open `chrome://extensions`, `edge://extensions` or `brave://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the repository folder.
4. After changing the code, click the reload icon on the extension's card, then reload the
   Instagram tab.

**Opera**

1. Go to `opera://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and select the repository folder.

**Firefox, Floorp and other Firefox-based browsers (version 128 or newer)**

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...** and select `manifest.json` in the repository folder.
3. In `about:addons`, open the extension, go to **Permissions**, and allow access to
   instagram.com, cdninstagram.com and fbcdn.net.
4. After changing the code, click **Reload** on the extension in `about:debugging`, then
   reload the Instagram tab.

Temporary add-ons are removed when the browser closes. For a permanent install, build the
`.xpi` as described under **Releases** below and follow the Floorp steps in Option 1.

**Safari (macOS, needs Xcode)**

Safari doesn't support `"world": "MAIN"` in the manifest, so it gets its own build:
`scripts/build_safari.py` swaps that entry for `safari/inject.js`, which loads `page.js` into
the page with a `<script>` tag. Everything else is shared.

1. In the repository folder, build the Safari version and its Xcode project:
   ```sh
   python3 scripts/build_safari.py --xcode
   ```
   This writes `dist/safari/`, creates the Xcode project in `dist/safari-xcode/` with
   `safari/make_xcode_project.py`, and opens it in Xcode. The script also fixes the bundle
   IDs Apple's converter generates, which otherwise make the build fail with "Embedded
   binary's bundle identifier is not prefixed with the parent app's bundle identifier".

*Building and enabling it in Safari:*

2. If Xcode reports a signing error, select the project in the sidebar, then under
   **Signing & Capabilities** set **Team** to your Apple ID or choose **Sign to Run Locally**,
   for both targets.
3. Press **Cmd+R** (Product > Run). A small "Block the Blocker" app opens, which you can
   close.
4. In Safari, open **Settings > Advanced** and turn on **Show features for web developers**.
5. In the menu bar, choose **Develop > Allow Unsigned Extensions**. Safari turns this off
   every time it quits, so repeat this step after restarting Safari.
6. In **Settings > Extensions**, turn on **Block the Blocker**.
7. Open instagram.com, click the extension's icon in the toolbar, and choose
   **Always Allow on This Website**.
8. After changing the code, run the build script again and press **Cmd+R** in Xcode.

</details>

After installing, open or **reload** instagram.com, log in, and click the extension icon.

## Use

1. On any instagram.com page, click the extension icon.
2. Enter `@username` or a numeric user ID and click **Find**.
3. Check the account shown and click **Block this account**.
4. Confirm under **Settings > Blocked accounts**.

### Finding a user ID yourself

If the lookup fails, you can enter the numeric user ID instead. The popup has these steps
under **How do I find someone's user ID?**:

1. Open a private window (`Ctrl+Shift+P` in Firefox or Floorp, `Ctrl+Shift+N` in Chrome or Edge).
2. Go to `instagram.com/<username>/`. You don't need to log in.
3. Press `Ctrl+U` to view the page source.
4. Press `Ctrl+F`, search for `profile_id`, and copy the number after it, for example
   `"profile_id":"25025320"`.
5. Paste it into the popup and click **Find**.

A lookup site such as [commentpicker.com](https://commentpicker.com/instagram-user-id.php)
also works. Using external websites sends the username to those sites.

## How it works

| File | Role |
|---|---|
| `src/page.js` | Runs in Instagram's page context. Reads `csrftoken`/`ds_user_id` from cookies, finds `fb_dtsg`, `lsd`, `__hsi`, `__spin_*` from the page (and from Instagram's own GraphQL traffic), computes `jazoest`, and sends the `usePolarisBlockManyMutation` request. |
| `src/bridge.js` | Content script that relays messages between the popup and `page.js`. |
| `popup/` | The toolbar popup: enter a username or ID, confirm, block. |
| `safari/`, `scripts/build_safari.py` | Safari build only. `inject.js` loads `page.js` into the page, since Safari lacks `"world": "MAIN"`. `make_xcode_project.py` wraps the build in an Xcode project with matching bundle IDs. |

Instagram changes the block mutation's `doc_id` from time to time. The extension ships with
a known one (`9575321849242740`). Whenever you block anyone the normal way on instagram.com,
it saves the current `doc_id` and uses that from then on. The popup footer shows which one
is in use.

### Finding the user ID

If an account has blocked you, Instagram hides it from lookups made with your session. The
popup tries these in order:

1. Profile lookup with your session (works for accounts that haven't blocked you).
2. Instagram search with your session.
3. **The logged-out profile page.** This is the step that finds accounts that blocked you.
   The extension loads `instagram.com/<username>/` without cookies, the same page a
   private window shows, and reads the ID from the data embedded in it
   (`"xig_user_by_username":{"pk":"...","username":"..."}`). Blocks only apply to your
   account, so they don't affect this page. The ID only counts if it sits next to the
   username you entered.

Instagram's logged-out API (`web_profile_info` without cookies) answers 401 (login
required), which is why step 3 reads the page instead.

**Lookup details** under the result shows what each method returned.

### Releases

Pushing a tag like `v0.1.0` runs [.github/workflows/release.yml](.github/workflows/release.yml),
which packages `manifest.json`, `src/` and `popup/` and publishes them as a GitHub release
with a `.zip` and an identical `.xpi`, plus the Safari build as `-safari.zip`. A macOS runner
also builds the Safari app with Xcode, signed ad hoc ("Sign to Run Locally"), and attaches
it as `-safari-app.zip`. The tag has to match `version` in `manifest.json`. Pull requests
run the same builds without publishing anything.

To build the same package locally:

```sh
git archive --format=zip -o instagram-btb.zip HEAD manifest.json src popup
```

## Notes

- This uses Instagram's private web API, the same one the web app uses. It can break
  without warning when Instagram changes it.
- It blocks one account per click on purpose. Automating Instagram is against its terms,
  so use this at your own risk.

## Manual process (original guide)

The extension automates the manual process below. It is kept here as reference for anyone building on it.

<details>
<summary>Show the original manual guide</summary>

# Instagram: Block the Blocker!

## A detailed guide to block someone who blocked you previously on Instagram.

Up until couple months ago, it was possible to block someone who blocked you on Instagram by simply tagging their username inside a comment under any post and going to their profile using that tag. This method would make the normally invisible menu button on their profile visible, and allow you to block them. This no longer works as it got patched, so we need to do some coding wizardry that anyone can replicate.

All credit goes to a Reddit user named [**Exotic_Mall7928**](https://www.reddit.com/r/Instagram/comments/1kapa20/comment/n1uzxz2/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button), who came up with this method. I am creating this document to make the steps more clear to non-developer users. This process has since been turned into a browser extension, described at the top of this README.

### Requirements

- A computer
- A browser which you will use to login to your Instagram account
- A tech-savvy friend, in case you f**k it up.

### Steps to Follow

1. Open (or if you don't have one: install) a browser of your choice. It is better to use Chrome for this since the method was tested multiple times on Chrome, but Firefox and Opera should do fine as well. Safari should also work, but I haven't tried it yet. If you want to use Safari, be my guest.

2. Login to your Instagram account through browser.

3. Go to a profile. A random one is better since you are about to block it. Better if it's a public profile.

4. Open up your browser's developer tools. For Chrome, you can go to **three dot menu button located at top right -> More Tools -> Developer Tools**, or press **Ctrl+Shift+I** or **F12**. Then navigate to the **Network** tab.

5. While that inspector is open, block that random profile but do not click the dismiss button. **If you dismiss it, the page will reload and you will have to do everything again up until now.** You should have something like the image below.

<img width="1548" height="456" alt="block_1" src="https://github.com/user-attachments/assets/5d37e30e-c37b-4471-abf0-f73553fe82cb" />

6. The moment you do the block, something named **query** will pop up in that inspector (bottom right in the screenshot above). Right click on it, and hover over **Copy** option. It will provide you with options to copy as **cURL (cmd)**, **cURL (bash)** or **PowerShell**. All can work depending on how you edit them, but I suggest sticking with the original instructions so select **cURL (cmd)** option.

7. Open your favorite text editor. Could be Notepad, Notepad++ or SublimeText. Doesn't matter much, just an application you can paste some long text and keep it open while editing it. Paste that copied cURL and keep it open. You will need it.

8. Copy the entire code below and paste it into your text editor into a new tab or somewhere seperate as well. This is the request we will fill and call through console to execute a manual block.

```sh
curl --ssl-no-revoke "https://www.instagram.com/graphql/query/" \

-X POST \

-H "Content-Type: application/x-www-form-urlencoded" \

-H "User-Agent: Mozilla/5.0" \

-H "x-csrftoken: [PLACEHOLDER_CSRFTOKEN]" \

-H "x-fb-lsd: [PLACEHOLDER_X_FB_LSD]" \

-H "x-ig-app-id: 936619743392459" \

-H "x-fb-friendly-name: usePolarisBlockManyMutation" \

-H "x-root-field-name: xdt_block_many" \

-b "sessionid=[PLACEHOLDER_SESSIONID]; csrftoken=[PLACEHOLDER_CSRFTOKEN]; datr=[PLACEHOLDER_DATR]; ds_user_id=[PLACEHOLDER_DS_USER_ID]" \

--data-raw "av=[PLACEHOLDER_AV]&__d=www&__user=[PLACEHOLDER_DS_USER_ID]&__a=1&__req=1&dpr=1&__ccg=EXCELLENT&__rev=1000000000&__s=[PLACEHOLDER_S]&__hsi=[PLACEHOLDER_HSI]&__comet_req=7&fb_dtsg=[PLACEHOLDER_FB_DTSG]&jazoest=[PLACEHOLDER_JAZOEST]&lsd=[PLACEHOLDER_LSD]&__spin_r=1000000000&__spin_b=trunk&__spin_t=[PLACEHOLDER_SPIN_T]&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=usePolarisBlockManyMutation&variables={\"target_user_ids\":[\"[PLACEHOLDER_TARGET_USER_ID]\"]}&server_timestamps=true&doc_id=9575321849242740"
```

9. Now the difficult part. Go back to your browser which still has the developer tools window open. Navigate to the **Application** tab. Then, on the left pane, under **Storage**, go to **Cookies** and select Instagram. It should look something like the image below.

<img width="958" height="909" alt="block_2" src="https://github.com/user-attachments/assets/e9caf075-b129-4fc6-a164-0571747eee8f" />

10. Copy the **csrftoken**, **datr**, **ds_user_id** and **sessionid** values and keep them somewhere. You will paste these into the respective slots inside the code from step 8.

11. Open the text where you copied over the cURL when you did the blocking. Do these things:
- Search for **x-fb-lsd** and note the value
- Search for **av=** and note the value
- Search for **_s=** and note the value
- Search for **hsi=** and note the value
- Search for **fb_dtsg=** and note the value
- Search for **jazoest=** and note the value
- Search for **lsd=** and note the value
- Search for **spin_t=** and note the value

***Note***: You will probably see that the values are enclosed in **"^"** characters. **Do not copy them!** For example, for your **x-fb-lsd** search, you might see something like:

```
-H ^"x-fb-lsd: ks6zK-lwZj2kt7UpcFu9dw^" ^
```

Here, the value you should be copying is **ks6zK-lwZj2kt7UpcFu9dw**, without the **"^"** marks. *(for developers: those are escape characters which is disgusting syntax if you ask me...)*

Another example, let's look at **fb_dtsg** this time. It should look like this:

```
...&__comet_req=7^&fb_dtsg=NGfujIFw7lSDk9nQWM28tOWwpBXtQkBD5EQsqf9DbTRVNUrI3QmZaAg^%^3A17643991427186970^%^3A1547641376^&jazoest=...
```

Triple dots are representing the rest of the text within that long part. Anyways, the value you should be copying in this case is **NGfujIFw7lSDk9nQWM28tOWwpBXtQkBD5EQsqf9DbTRVNUrI3QmZaAg^%^3A17643991427186970^%^3A1547641376**, becaue **"^&"** mark represents the start of next variable/value that is unrelated.

12. Go to [this address](https://commentpicker.com/instagram-user-id.php). Type in the actual target user's username (the person you actually want to block) and copy over the user ID.

13. Go back to the paste you did in step 8. One by one, delete the placeholders (delete the brackets as well, they are a part of the placeholder) and replace them with respective values. **PLACEHOLDER_TARGET_USER_ID** is the target user ID from step 12, do not confuse it with your own. You need to replace the placeholders in the command with the values you noted from steps 10, 11 and 12.

14. Optional: Go to ChatGPT, copy the command from step 8 that you replaced the parts of and ask it to make it single line for you :)

15. If you are using a Mac or Linux, open up your terminal. If you are using Windows, open up CMD. **(Windows+R -> type in cmd)**

***Note***: Using PowerShell instead of CMD worked when I first prepared this guide, but currently using curl.exe instead of curl command directly (which is what you have to do while using PowerShell) causes a lot of problems so we should stick with CMD for now.

16. Paste the now properly filled in command from step 8. (if you are on Windows/PowerShell, change the initial **curl** word into **curl.exe** but again this currently fails as of 13.01.2026)

17. Pray to whichever god you believe in, and press enter.

18. Go back to your Instagram and look at your blocked list. If the person is there, congrats! If not, either reach out to me, or leave your questions here in the GitHub comments.

Here is a video tutorial of the process, I hope it helps.

[Instagram-BTB Tutorial Video](https://www.youtube.com/watch?v=U3YcldAJFH0)


</details>
