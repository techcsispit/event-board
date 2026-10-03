Closes #

## What I changed


## How it works
<!-- In your own words: why does this change fix the problem or add the feature? At least a couple of sentences. -->

Closes #1

## What I changed

I fixed the tag filtering so that it is not case-sensitive.

I also added partial matching, so users can search using only part of a tag.

## How it works

When the user enters a tag in the filter, both the entered text and the event tags are converted to lowercase before comparing them. This makes the filtering case-insensitive, so `Tech`, `tech`, and `TECH` are treated as the same.

I used `some()` to check all the tags of an event and `includes()` to check if the searched text is present in any tag. Because of this, partial searches also work. For example, searching for `tec` will match the tag `Tech`, and searching for `work` will match `Workshop`.
