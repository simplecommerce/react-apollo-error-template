/*** SCHEMA ***/
import { gql } from "@apollo/client";
import { buildASTSchema } from "graphql";
import { addResolversToSchema } from "@graphql-tools/schema";

const schemaAST = gql`
  type TestResult {
    testField: String!
  }

  type Query {
    test: TestResult!
  }
`;

const schemaWithoutResolvers = buildASTSchema(schemaAST);
const resolvers = {
  Query: {
    test: () => ({ testField: "hello world! :D" }),
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
import React, { useState } from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  useQuery,
} from "@apollo/client";
import "./index.css";

const TEST = gql`
  query Test {
    test {
      testField
    }
  }
`;

function App() {
  const {
    loading,
    data,
  } = useQuery(TEST);

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <h2>Test</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        JSON.stringify(data)
      )}
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
