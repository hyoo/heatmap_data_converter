# Heatmap data converter
This converts PATRIC heatmap data into flattened tsv

```
# uncomment lines in fetch.sh to fetch
# this will download heatmap raw data like micro.json
$ sh fetch.sh

# this will convert to micro.tsv
$ ./converter -d micro

./clustergrammer_json_converter.js -d small
./clustergrammer_json_converter.js -d medium
./clustergrammer_json_converter.js -d large

place output file into clustergrammer project - replace contents of file "clustergrammer/json/mult_view.json"

runs locally on firefox, performance much better on chrome
```