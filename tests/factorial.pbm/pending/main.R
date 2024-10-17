main <- function() {
    while(TRUE) {
        x <- as.integer(readline())
        if (is.na(x)) break
        cat(factorial(x), "\n")
    }
}

main()
