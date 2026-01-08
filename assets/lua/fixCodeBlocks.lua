-- This function runs on every CodeBlock element.
function CodeBlock(el)
  -- Check if a 'language' attribute exists (from the lstlisting options).
  if el.attributes.language then
    -- Get the language name from the attribute.
    -- We convert it to lowercase, as is standard for Markdown code fences.
    local lang = el.attributes.language:lower()

    -- A Markdown code block's language is determined by its first class.
    -- We replace all existing classes with a new list containing only our language.
    el.classes = pandoc.List{lang}

    -- We clear all other attributes (like morekeywords) to keep the output clean.
    el.attributes = {}
  end

  -- Return the modified (or original) element.
  return el
end