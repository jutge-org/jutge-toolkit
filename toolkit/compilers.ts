import { getAvailableCompilers, getCompilersInfo, getDefinedCompilerIds } from '../compilers'
import { Command } from '@commander-js/extra-typings'

export const compilersCmd = new Command('compilers')
    .description('Query compiler information')
    // default action is to list all compilers because of older compatibility

    .action(async () => {
        const info = await getCompilersInfo()
        console.dir(info)
    })

compilersCmd
    .command('list-defined')
    .description('List all defined compiler names')

    .action(async () => {
        const items = await getDefinedCompilerIds()
        console.dir(items)
    })

compilersCmd
    .command('list-available')
    .description('List all available compiler names')

    .action(async () => {
        const items = await getAvailableCompilers()
        console.dir(items)
    })
