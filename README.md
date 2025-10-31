# Instagram: Block the Blocker!

## A detailed guide to block someone who blocked you previously on Instagram.

Up until couple months ago, it was possible to block someone who blocked you on Instagram by simply tagging their username inside a comment under any post and going to their profile using that tag. This method would make the normally invisible menu button on their profile visible, and allow you to block them. This no longer works as it got patched, so we need to do some coding wizardry that anyone can replicate.

All credit goes to a Reddit user named [**Exotic_Mall7928**](https://www.reddit.com/r/Instagram/comments/1kapa20/comment/n1uzxz2/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button), who came up with this method. I am creating this document to make the steps more clear to non-developer users. I am planning to make this into a full browser extension which will add a "Block a user that blocked you" button to your blocked users page on Instagram, but that is for far future.

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
- Search for **s=** and note the value
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

15. If you are using a Mac or Linux, open up your terminal. If you are using Windows, open up PowerShell. **(Windows+R -> type in powershell)**

16. Paste the now properly filled in command from step 8. If you are on Windows/PowerShell, change the initial **curl** word into **curl.exe**.

17. Pray to whichever god you believe in, and press enter.

18. Go back to your Instagram and look at your blocked list. If the person is there, congrats! If not, either reach out to me, or leave your questions here in the GitHub comments.
