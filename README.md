# cities-distances

## Data sources

### Cities

https://www.geonames.org/countries/FR/france.html

Side note - I tried to retrieve this data through DBpedia using SPARQL with queries like:
```
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbr: <http://dbpedia.org/resource/>
SELECT ?city WHERE {
 ?city a dbo:City ;
    dbo:country dbr:France
}
```
but unfortunately, cities in France are extremely badly referenced

