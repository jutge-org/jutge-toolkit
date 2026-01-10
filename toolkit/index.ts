#!/usr/bin/env bun

import { program } from '@commander-js/extra-typings'
import { ZodError } from 'zod'
import { fromError } from 'zod-validation-error'
import { settings } from '../lib/settings'
import { packageJson } from '../lib/versions'
import { aboutCmd } from './about'
import { aiCmd } from './ai'
import { verifyCmd } from './verify'
import { cleanCmd } from './clean'
import { compilersCmd } from './compilers'
import { configCmd } from './config'
import { cloneCmd } from './clone'
import { doctorCmd } from './doctor'
import { generateCmd } from './generate'
import { makeCmd } from './make'
import { quizCmd } from './quiz'
import { upgradeCmd } from './upgrade'
import { uploadCmd } from './upload'
import { askCmd } from './ask'

program.name(Object.keys(packageJson.bin as Record<string, string>)[0] as string)
program.alias(Object.keys(packageJson.bin as Record<string, string>)[1] as string)
program.version(packageJson.version)
program.description(packageJson.description!)
program.helpCommand('help [command]', 'Display help for command') // To get the message with uppercase :-)
program.addHelpText('after', '\nMore documentation:\n  https://github.com/jutge-org/new-jutge-toolkit/tree/main/docs')

program.addCommand(configCmd)
program.addCommand(cloneCmd)
program.addCommand(generateCmd)
program.addCommand(makeCmd)
program.addCommand(uploadCmd)
program.addCommand(cleanCmd)
program.addCommand(verifyCmd)
program.addCommand(doctorCmd)
if (settings.developer) {
    program.addCommand(quizCmd)
    program.addCommand(compilersCmd)
    program.addCommand(aiCmd)
}
program.addCommand(upgradeCmd)
program.addCommand(aboutCmd)
program.addCommand(askCmd)

try {
    await program.parseAsync()
} catch (error) {
    console.log()
    console.error('An error occurred:')
    if (error instanceof Error) {
        if (error.name === 'ExitPromptError') {
            console.error('Operation cancelled by the user')
        } else if (error instanceof ZodError) {
            console.error(fromError(error).toString())
        } else {
            console.error(error.message)
            if (settings.developer) console.error(error)
        }
    } else {
        console.error(error)
    }
}
