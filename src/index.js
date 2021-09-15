/*** SCHEMA ***/
import { gql } from "@apollo/client";
import { buildASTSchema } from "graphql";
import { addResolversToSchema } from "@graphql-tools/schema";

const schemaAST = gql`
  type ResultA {
    fieldA: String!
  }

  type ResultB {
    fieldB: String!
  }

  type Query {
    queryA: ResultA!
    queryB: ResultB!
  }
`;

const schemaWithoutResolvers = buildASTSchema(schemaAST);
const resolvers = {
  Query: {
    queryA: () => new Error('query A failed 😢'),
    queryB: () => ({ fieldB: 'hello world!' }),
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
    await delay(1000);
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
import React, { useState } from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  useQuery,
} from "@apollo/client";
import "./index.css";

const GetQueryA = gql`
  query GetQueryA {
    queryA {
      fieldA
    }
  }
`;

const GetQueryB = gql`
  query GetQueryB {
    queryB {
      fieldB
    }
  }
`

const QueryAComponent = () => {
  const { loading, error } = useQuery(GetQueryA, { fetchPolicy: 'cache-first', nextFetchPolicy: 'cache-first', notifyOnNetworkStatusChange: true })
  return (
    <>
      <div>Query A Loading: {String(loading)}</div>
      <div>Query A Error: {error?.message}</div>
    </>
  );
};

const QueryBComponent = () => {
  const { loading, data } = useQuery(GetQueryB, { fetchPolicy: 'cache-first', nextFetchPolicy: 'cache-first', notifyOnNetworkStatusChange: true })
  return (
    <>
      <div>Query B Loading: {String(loading)}</div>
      <div>Query B Data: {JSON.stringify(data)}</div>
    </>
  );
};

function App() {
  const [AMounted, setAMounted] = useState(false);
  const [BMounted, setBMounted] = useState(false);

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        Click "Mount A", then wait for loading to finish. Click "Mount B", wait for loading to finish, and notice that query A wrongly refetches.
      </p>
      <div>
        <button onClick={() => setAMounted(true)}>Mount A</button>
      </div>
      {AMounted && <QueryAComponent />}
      <div>
        <button onClick={() => setBMounted(true)}>Mount B</button>
      </div>
      {BMounted && <QueryBComponent />}
    </main>
  );
}

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link
});

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
