/*** SCHEMA ***/
import { gql } from "@apollo/client";
import { buildASTSchema } from "graphql";
import { addResolversToSchema } from "@graphql-tools/schema";

const schemaAST = gql`
  type QueryMeta {
    page: Int!
    totalPages: Int!
  }

  interface QueryResult {
    meta: QueryMeta!
  }

  type Fruit {
    id: String!
    name: String!
  }

  type Vegetable {
    id: String!
    name: String!
  }

  type FruitsQueryResult implements QueryResult {
    meta: QueryMeta!
    results: [Fruit!]!
  }

  type VegetablesQueryResult implements QueryResult {
    meta: QueryMeta!
    results: [Vegetable!]!
  }

  type Query {
    fruits(page: Int!): FruitsQueryResult!
    vegetables(page: Int!): VegetablesQueryResult!
  }
`;

const fruits = [
  { id: '1', name: 'apple' },
  { id: '2', name: 'grape' },
  { id: '3', name: 'banana' },
  { id: '4', name: 'lemon' },
  { id: '5', name: 'lime' },
  { id: '6', name: 'grapefruit' },
  { id: '7', name: 'orange' },
  { id: '8', name: 'strawberry' },
  { id: '9', name: 'kiwi' },
  { id: '10', name: 'dragonfruit' },
  { id: '11', name: 'persimmon' },
  { id: '12', name: 'mango' },
  { id: '13', name: 'pineapple' },
  { id: '14', name: 'pear' },
];

const vegetables = [
  { id: '1', name: 'tomato' },
  { id: '2', name: 'cucumber' },
  { id: '3', name: 'spinach' },
  { id: '4', name: 'lettuce' },
  { id: '5', name: 'broccoli' },
  { id: '6', name: 'cauliflower' },
  { id: '7', name: 'carrot' },
  { id: '8', name: 'cabbage' },
  { id: '9', name: 'eggplant' },
  { id: '10', name: 'squash' },
  { id: '11', name: 'green bean' },
  { id: '12', name: 'peas' },
  { id: '13', name: 'corn' },
  { id: '14', name: 'bell pepper' },
];

const schemaWithoutResolvers = buildASTSchema(schemaAST);
const resolvers = {
  Query: {
    // page size is hardcoded to 3 for this reproduction
    fruits: (_, { page }) => ({ meta: { page, totalPages: Math.ceil(fruits.length/3) }, results: fruits.slice((page - 1) * 3, page * 3) }),
    vegetables: (_, { page }) => ({ meta: { page, totalPages: Math.ceil(vegetables.length/3) }, results: vegetables.slice((page - 1) * 3, page * 3) }),
  },
};
const schema = addResolversToSchema({ schema: schemaWithoutResolvers, resolvers });

/*** LINK ***/
import { graphql, print } from "graphql";
import { ApolloLink, Observable } from "@apollo/client";
function delay(wait) {
  return new Promise(resolve => setTimeout(resolve, wait));
}

const link = new ApolloLink(operation => {
  return new Observable(async observer => {
    const { query, operationName, variables } = operation;
    await delay(300);
    try {
      const result = await graphql(
        schema,
        print(query),
        null,
        null,
        variables,
        operationName,
      );
      observer.next(result);
      observer.complete();
    } catch (err) {
      observer.error(err);
    }
  });
});

/*** APP ***/
import React from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  useQuery,
} from "@apollo/client";
import "./index.css";

const FRUITS = gql`
  fragment ResultFragment on QueryResult {
    meta {
      page
      totalPages
    }
  }

  query Fruits($page: Int!) {
    fruits(page: $page) {
      # if the following is uncommented then the query works fine:
      # meta {
      #   page
      #   totalPages
      # }
      results {
        id
        name
      }
      ...ResultFragment
    }
  }
`;

function App() {
  const {
    loading,
    data,
    fetchMore,
  } = useQuery(FRUITS, { variables: { page: 1 } });

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <p>
        Instructions: Click the "Fetch More" button and the application will crash because data.fruits.meta is undefined.
        If you put a breakpoint/console.log inside the merge function, you can see that this data is coming back from the server (link) correctly but Apollo Client is dropping it.
        If you put the meta fields directly in the query instead of in the fragment, then everything works fine.
      </p>
      <h2>List of fruits</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div>
          Total Pages: {data.fruits.meta.totalPages}
          <button style={{ display: 'block' }} onClick={() => fetchMore({ variables: { page: data.fruits.meta.page + 1 }})}>Fetch More</button>
          <ul>
            {data.fruits.results.map(fruit => (
              <li key={fruit.id}>{fruit.name}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

const paginatedQueryMerge = (
	existing,
	incoming,
	{ args },
) => {
	if (existing == null || args == null || args.page == null || args.page === 1) {
		return incoming;
	}

	const mergedArray = [...existing.results];
	const offset = (args.page - 1) * 3; // page size is hardcoded to 3 for this reproduction
	incoming.results.forEach((val, index) => {
		mergedArray[offset + index] = val;
	});
	return {
		meta: { ...existing.meta, ...incoming.meta },
		results: mergedArray,
	};
};

const client = new ApolloClient({
  cache: new InMemoryCache({
    possibleTypes: { QueryResult: ['FruitsQueryResult', 'VegetablesQueryResult'] },
    typePolicies: {
      Query: {
        fields: {
          fruits: { keyArgs: [], merge: paginatedQueryMerge },
          vegetables: { keyArgs: [], merge: paginatedQueryMerge },
        },
      },
    },
  }),
  link
});

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
