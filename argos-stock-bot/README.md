# Argos stock bot

Watches Argos products. When one comes back in stock (or drops to your target
price) it sends a notification to your phone, then adds it to your trolley in a
signed-in browser. You press checkout and approve the payment yourself.

It never stores your card details or password. Your Argos sign-in stays in the
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
   - `argos`: the product link, or the catalogue number like `123/4567`
   - `target_price`: the most you'll pay, or `null` to alert on any price
   - `ntfy_topic`: the topic name from step 4
6. **Sign in to Argos once:**
   ```
   python bot.py login
   ```
   Sign in in the window that opens, then close it.

## On a Mac

Use Terminal (Applications > Utilities) and type `python3` and `pip3` where the
steps say `python` and `pip`:

```
cd ~/Downloads/New-claude-argos-stock-bot/argos-stock-bot
python3 -m pip install -r requirements.txt
python3 -m playwright install chromium
cp config.example.json config.json
open -e config.json          # edit your products, save, close
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
```

Your computer has to be on and awake for `run` to keep checking. When a product
is ready to buy, a browser window opens with it in your trolley. Finish checkout
there, then close the window and the bot carries on.

To turn off the automatic trolley step and get alerts only, set
`"add_to_trolley": false` in `config.json`.

## Good to know

- It checks every 10 minutes by default and won't go faster than every
  5 minutes. Checking very often can get you blocked by Argos, and automated
  access may be against Argos's terms of use, so keep it gentle.
- Stock shown on a product page can differ by postcode, and it may say "in
  stock" when your local store or delivery area has none.
- If Argos changes its website, the bot may report "stock unknown". Send the
  output to Claude and it can update the code.
