-- A set of environment names to be removed completely.
-- Add the names of your custom environments to this list.
local environments_to_remove = {
  latexonly = true,
  ignora = true
}

-- This function is called for every 'Div' element in the document.
-- Pandoc parses LaTeX environments like \begin{solution}...\end{solution}
-- into Div elements with the environment name as a class.
function Div(div)
  -- Check if the Div has a class and if that class is in our removal list.
  if div.classes[1] and environments_to_remove[div.classes[1]] then
    -- If it is, return an empty list to remove it from the output.
    return {}
  else
    -- Otherwise, return nil to leave it unchanged.
    return nil
  end
end