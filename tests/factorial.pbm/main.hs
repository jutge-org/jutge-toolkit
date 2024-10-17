main :: IO()
main = do
    contents <- getContents
    let numbers = map read (lines contents) :: [Int]
    let results = map factorial numbers
    mapM_ print results