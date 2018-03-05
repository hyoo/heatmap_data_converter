#!/usr/bin/env node

const fs = require('fs-extra')
const process = require('process')
const opts = require('commander')

if (require.main === module) {

    opts.option('-d, --dataset [value]', 'Dataset name: micro, small, medium, large')
    .option('-o, --output_format [value]', 'Output format: simple (default), meta')
    .parse(process.argv)

    if (!opts.dataset) {
        console.error('require dataset name')
        opts.help()
    }

    runConverter(opts.dataset, opts.output_format || 'simple')
}

function runConverter(dataset, output_format) {

    console.log(`dataset: ${dataset}, output: ${output_format}`)

    // make sure files are exit
    try {
        const has_reqeust_json = fs.statSync(`req.${dataset}.json`)
        const has_response_json = fs.statSync(`${dataset}.json`)
    } catch (ex) {
        console.log(ex.message)
    }

    const req_body = fs.readJsonSync(`req.${dataset}.json`, {encoding: 'utf8'})
    const genomes_set = req_body.params[0].genomeFilterStatus
    const genomes = Object.keys(genomes_set)
    const total_genomes = genomes.length

    let output_header
    if (output_format === 'simple') {
        const header_genomes = genomes.map(genome_id => `GENOME: ${genome_id}`)
        output_header = [ [''].concat(header_genomes).join('\t') ].join('\n')
    } else {
        const header_genomes = genomes.map(genome_id => `GENOME: ${genome_id}`)
        const header_names = genomes.map(genome_id => `NAME: ${genomes_set[genome_id].label}`)
        output_header = [ ['', ''].concat(header_genomes).join('\t'), ['', ''].concat(header_names).join('\t') ].join('\n')
    }

    const res_body = fs.readJsonSync('micro.json', {encoding: 'utf8'})
    const families = res_body.result

    const output_body = []

    for (let i = 0, len = families.length; i < len; i++) {
        const family = families[i]
        const row = (output_format === 'simple') ? [`${family.family_id}`] : [`FAMILY: ${family.family_id}`, `FAMILY Name: ${family.description}`]
        for(let j = 0; j < total_genomes; j++) {
            const index = j * 2
            const val = parseInt(family.genomes.charAt(index) + family.genomes.charAt(index + 1), 16);
            // console.log(`${family.family_id}: ${index} -> ${family.genomes.charAt(index)}, ${index+1} -> ${family.genomes.charAt(index + 1)} => ${val} `)
            row.push(val)
        }
        output_body.push(row.join('\t'))
    }

    console.log(`writing converted file to ${dataset}.tsv`)
    fs.writeFileSync(`${dataset}.tsv`, output_header + '\n' + output_body.join('\n'), {encoding: 'utf8'})
}