# Heatmap data converter
This converts PATRIC heatmap data into flattened tsv

```
# uncomment lines in fetch.sh to fetch
# this will download heatmap raw data like micro.json
$ sh fetch.sh

# this will convert to micro.tsv
$ ./converter -d micro
```