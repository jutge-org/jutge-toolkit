import { Command } from '@commander-js/extra-typings'
import { collectMultimetricOverall } from '../lib/metrics'
import tui from '../lib/tui'

export const metricsCmd = new Command('metrics')
    .summary('Print multimetric overall metrics for source files')
    .description(`Print multimetric overall metrics for source files
        
The metrics are calculated using the Python multimetric package.
See https://github.com/priv-kweihmann/multimetric for item structure and recommended thresholds.`)

    .argument('<files...>', 'source files to analyze')

    .action(async (files) => {
        if (files.length === 0) {
            throw new Error('At least one source file is required')
        }
        const metrics = await collectMultimetricOverall(files)
        tui.yaml(metrics)
    })
