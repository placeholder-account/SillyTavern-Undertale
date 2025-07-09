An extension that adds Undertale-like textboxes.

## Features

- Undertale heart cursor that snaps to buttons
- Select and confirm sound effects
- Mouth flap animation for talking if you make sprites for it
- Undertale text sound effects
- Customizable character sprites, font and voice
- Slow, fast, quiet (small) and big (loud) text
    - Mouth flap animation and text speed/volume changes based on this
- Sound effect boxes that function similarly to text boxes
- New messages, swipes and edited messages can be read with NEXT button
- Old messages loaded on chat load automatically expanded and can be replayed
- Ability to skip and replay any textbox by clicking on it again
- Default/fallback sprite and character voice
- Does not work with group chats or streaming
- Doesn't work without prompting the AI to use the right format

## Usage

1. Import the regex file (containing multiple regexes) in the extension root into your global/scoped regexes. You must do it this way because I don't know how to apply regex on messages from the extension.
2. (Optional) Customization per character:
   1. To the public/sounds folder add a folder named {{char}} and inside a file named voice.mp3. You can find UT character voices online, personally I got them from a random website.
   2. Create a sprite folder in the public folder. Inside also add a {{char}} folder with two folders named "thinking" and "talking" inside of it. Inside of those go emotion.png, one with the mouth open.
   3. Go into the fonts/fonts.json file in the extension and put "{{char}}": "Fontname" like the others.
3. Turn on the extension.
4. Tell the AI in the PHI how to format its message. Here is an example prompt:

```angular2html
{{original}}

Mimic Toby Fox's writing style, complete with the style of comedy mixed with more simple, to-the-point narration that Deltarune and Undertale are known for. The boxes will refer to {{char}} in the third person. Thoughts will be in the first person and will ONLY include {{char}}'s internal subjective commentary, while the narration will serve as our eyes and ears, describing what {{char}} does, what happens, the descriptions of objects {{char}} interacts with. Dialogue tags are {{char}}'s dialogue. Thoughts and narration must be inside brackets.

An example of the formatting:

<narration>
({{char}} wrings their hands behind them.)
</narration>

<thoughts speed="faster" extra="quiet">
[sprite emotion="neutral_nervous"]
(That's not good, I'm already getting antsy. I should find the broom.)
</thoughts>

<narration>
({{char}} looks around the room. Shockingly, the broom is..!!
...in the broom closet.)
</narration>

<dialogue speed="normal">
[sprite emotion="embarrassed"]
I should really remember that by now...
</dialogue>

The following emotions are available: (Put list of sprite emotions here.)

You may also use an "extra" parameter, which is optional and must always be the LAST parameter if you choose to use it. The two valid values for this parameter are "loud" or "quiet". 

The speed parameter is mandatory for dialogue and thoughts. The speed parameter should not be used for narration.

You may include sound effects in between the narration, dialogue and thoughts (not inside them), formatted as [sound="sound"]. The available sound effects are: (Put list of effects you want the AI to use here.)

Each box should only contain 1-3 lines, 1-3 sentences and ideally 10-15 words.
```

It doesn't have the fancy extension menu thing because I don't know how to do that.

There are many Undertale sound effects in the sounds/sfx folder, you can rename them or add more.

## Support and Contributions

Report bugs and performance issues, it is not thoroughly tested. If you want additional functionality then please add it yourself. You can submit additional functionality or fixes and I'll take a look at it.
