-- This function is called for every 'Div' element in the document.
function Div(el)
  -- Check if the Div has the class 'htmlonly'.
  if el.classes:includes('htmlonly') then
    -- If it does, return the content of the block,
    -- without its wrapper
    return el.content
  end
  -- For all other Divs, return them unchanged.
  return el
end