/*** SCHEMA ***/
import { gql } from "@apollo/client";
import { buildASTSchema } from "graphql";
import { addResolversToSchema } from "@graphql-tools/schema";

const schemaAST = gql`
  type MyNumbers {
    id: String!
    numberPlusOne: Int!
    numberPlusTwo: Int!
  }

  type Query {
    myNumbers(inputNumber: Int!): MyNumbers!
  }
`;

const schemaWithoutResolvers = buildASTSchema(schemaAST);
const resolvers = {
  Query: {
    myNumbers: (_, { inputNumber }) => ({ id: String(inputNumber), numberPlusOne: inputNumber + 1, numberPlusTwo: inputNumber + 2 }),
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
    if (operationName === 'GetMyNumberPlusTwo') {
      await delay(700);
    } else {
      await delay(300);
    }
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
import React, { useState, useCallback } from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  useQuery,
} from "@apollo/client";
import "./index.css";

const MY_NUMBER_PLUS_ONE = gql`
  query GetMyNumberPlusOne($inputNumber: Int!) {
    myNumbers(inputNumber: $inputNumber) {
      id
      numberPlusOne
    }
  }
`;

const MY_NUMBER_PLUS_TWO = gql`
  query GetMyNumberPlusTwo($inputNumber: Int!) {
    myNumbers(inputNumber: $inputNumber) {
      id
      numberPlusTwo
    }
  }
`

function App() {
  const [inputNumber, setInputNumber] = useState(1);
  const {
    loading: loading1,
    data: data1,
  } = useQuery(MY_NUMBER_PLUS_ONE, { fetchPolicy: 'cache-and-network', notifyOnNetworkStatusChange: true, variables: { inputNumber } });

  const {
    loading: loading2,
    data: data2,
  } = useQuery(MY_NUMBER_PLUS_TWO, { fetchPolicy: 'cache-and-network', notifyOnNetworkStatusChange: true, variables: { inputNumber } });

  const inputChangeHandler = useCallback((event) => {
    setInputNumber(Number(event.target.value));
  }, []);

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <input type="number" value={inputNumber} onChange={inputChangeHandler} />
      {loading1 ? (
        <p>Loading 1…</p>
      ) : (
        <p>
          Data 1: {JSON.stringify(data1)}
        </p>
      )}
      {loading2 ? (
        <p>Loading 2…</p>
      ) : (
        <p>
          Data 2: {JSON.stringify(data2)}
        </p>
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
