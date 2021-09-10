# cities-distances

## Overview

## Graph database

In this project, I decided to use a graph DB such as Neo4j. In my perspective, it fitted perfectly what I intended to do with the data :
- Finding out how connected were the cities
- How disconnected some could be
- Trying to extract fun facts from it

Here are some cypher queries that I found interesting :
```
# How many unique cities can be reached directly from Paris (without the need to change trains)
MATCH (a:City {name:"Paris"})-[*..3]-(b:City) RETURN count(DISTINCT b)

# Find all the shortest paths between two cities
MATCH (a:City {name:"Dinan"}) MATCH (b:City {name:"Rennes"}) RETURN allShortestPaths((a)-[*..5]-(b))
```

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

