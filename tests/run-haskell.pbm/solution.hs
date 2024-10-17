

absValue :: Int -> Int
absValue x
    | x > 0     = x
    | otherwise = -x


power :: Int -> Int -> Int
power x p
    | p == 0    = 1
    | even p    = aux * aux
    | otherwise = aux * aux * x
    where
        aux = power x (div p 2)


isPrime :: Int -> Bool
isPrime 0 = False
isPrime 1 = False
isPrime n = not $ findDivisor 2
    where
        findDivisor i
            | i >= n        = False
            | otherwise     = mod n i == 0 || findDivisor (i+1)


slowFib :: Int -> Int
slowFib n
    | n <= 1        = n
    | otherwise     = slowFib (n-1) + slowFib (n-2)


quickFib :: Int -> Int
quickFib n = snd (fib n)
    where
        fib 0 = (0, 0)
        fib 1 = (0, 1)
        fib i = (f1, f1+f2)
            where (f2,f1) = fib (i-1)
