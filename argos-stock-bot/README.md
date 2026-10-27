# Stock bot

Watches products at Argos, John Lewis, Currys, Smyths and Very. When one comes back in stock (or drops to your target
price) it sends a notification to your phone, then adds it to your Argos trolley or
John Lewis basket in a signed-in browser. You press checkout and approve the payment yourself.

It never stores your card details or passwords. Your shop sign-ins stay in the
`browser-profile` folder on your own computer.

## Setup (about 10 minutes, once)

1. **Install Python 3.10 or newer** from https://www.python.org/downloads/.
   On Windows, tick **Add Python to PATH** in the installer.
2. **Open a terminal in this folder** (Windows: open the folder, click the
   address bar, type `cmd`, press Enter).
3. **Install the bot's parts:**
   ```
   pip install -r requirements.txt
   python -m playwright install chromium
   ```
4. **Set up phone notifications:** install the free **ntfy** app (iPhone or
   Android), tap **+**, and subscribe to a topic with a long random name, like
   `sean-argos-7f3k2q9`. Anyone who knows the name can see your alerts, so
   don't use something guessable.
5. **Add your products:** copy `config.example.json` to `config.json` and edit it:
   - `url`: the product link from any of those shops. For Argos you can also use
     the catalogue number, like `123/4567`. John Lewis links end in `/p` and
     a number, like `johnlewis.com/product-name/p1234567`.
   - `target_price`: the most you'll pay, or `null` to alert on any price
   - `ntfy_topic`: the topic name from step 4
6. **Sign in to each shop once:**
   ```
   python bot.py login
   ```
   A window opens with an Argos tab and a John Lewis tab. Sign in on both,
   then close the window.

## On a Mac

Use Terminal (Applications > Utilities) and type `python3` and `pip3` where the
steps say `python` and `pip`:

```
cd ~/Downloads/New-claude-argos-stock-bot/argos-stock-bot
python3 -m pip install -r requirements.txt
python3 -m playwright install chromium
cp config.example.json config.json
nano config.json             # edit your products; Ctrl+O, Enter to save, Ctrl+X to exit
python3 bot.py login
python3 bot.py check
caffeinate -i python3 bot.py run
```

`caffeinate -i` stops the Mac from going to sleep while the bot runs. Keep it
plugged in, and leave the lid open unless it's connected to an external
display, because closing the lid still puts it to sleep.

If macOS says `python3` needs the command line developer tools, click
**Install**, wait for it to finish, then run the step again.

## Using it

```
python bot.py check   # check everything once, to make sure it works
python bot.py run     # keep checking every 10 minutes (Ctrl+C to stop)
python bot.py run 60  # keep checking for 60 minutes, then stop
```

Your computer has to be on and awake for `run` to keep checking. When a product
is ready to buy, a browser window opens with it in your trolley or basket. Finish checkout
there, then close the window and the bot carries on.

Each check opens a browser window for a few seconds, because some shops
refuse hidden browsers. Leave it alone and it closes by itself.

To turn off the automatic trolley and basket step and get alerts only, set
`"add_to_trolley": false` in `config.json`.

## Good to know

- It checks every 10 minutes by default and won't go faster than every
  5 minutes. Checking very often can get you blocked, and automated access
  may be against Argos's and John Lewis's terms of use, so keep it gentle.
- Argos stock shown on a product page can differ by postcode, and it may say "in
  stock" when your local store or delivery area has none.
- If a shop refuses the bot, the check says "refused the page" for that
  product. Argos does this. Don't try to get around it; use the shop's own
  back-in-stock alert instead.
- If a shop changes its website, the bot may report "stock unknown". Send the
  output to Claude and it can update the code.
