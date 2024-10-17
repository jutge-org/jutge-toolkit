(defn abs-value [x]
  (if (< x 0)
  (- x) x))

(defn power1 [x p]
  (if (= p 0) 1 (* x (power1 x (- p 1)))))

(defn power2 [x p]
  (loop [acc 1 i p]
    (if (= i 0) acc
      (recur (* acc x) (dec i)))))

(defn prime? [n]
  (let [find-divisor 
    (fn [i n]
      (cond
        (> i (/ n 2)) false
        (= (mod n i) 0) true
        :else (recur (inc i) n)))]
    (if (< n 2) false
      (not (find-divisor 2 n)))))



