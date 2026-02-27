import {
    execPythonCode
} from './lib/quiz'

const v = await execPythonCode(`
import random
r = random.randint(0, 1000)
`, 421)

console.log(v)
