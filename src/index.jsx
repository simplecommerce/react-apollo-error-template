/*** SCHEMA ***/
import { buildASTSchema, parse } from "graphql";
import { addResolversToSchema } from "@graphql-tools/schema";

const peopleData = [
  { id: 1, name: "John Smith" },
  { id: 2, name: "Sara Smith" },
  { id: 3, name: "Budd Deey" },
];

const schemaAST = parse(`#graphql
  type Person {
    id: ID!
    name: String!
  }

  type Query {
    people: [Person!]!
  }

  type Mutation {
    addPerson(name: String): Person!
  }
`);

const resolvers = {
  Query: {
    people: () => peopleData,
  },
  Mutation: {
    addPerson: (_, { name }) => {
      const person = {
        id: peopleData[peopleData.length - 1].id + 1,
        name,
      };

      peopleData.push(person);
      return person;
    },
  },
};

const schema = addResolversToSchema({
  schema: buildASTSchema(schemaAST),
  resolvers,
});

/*** LINK ***/
import { graphql, print } from "graphql";
import { ApolloLink, Observable } from "@apollo/client";
function delay(wait) {
  return new Promise((resolve) => setTimeout(resolve, wait));
}

const link = new ApolloLink((operation) => {
  return new Observable(async (observer) => {
    const { query, operationName, variables } = operation;
    await delay(300);
    try {
      const result = await graphql({
        schema,
        source: print(query),
        variableValues: variables,
        operationName,
      });
      observer.next(result);
      observer.complete();
    } catch (err) {
      observer.error(err);
    }
  });
});

/*** APP ***/
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  useQuery,
  useMutation,
} from "@apollo/client";
import "./index.css";

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      name
    }
  }
`;

const ADD_PERSON = gql`
  mutation AddPerson($name: String) {
    addPerson(name: $name) {
        name
    }
  }
`;

function PeopleList({ setIsQueryCompleted }) {
  const { loading, data } = useQuery(ALL_PEOPLE, {
    onCompleted: () => {
      setIsQueryCompleted(true);
    },
  });
  return loading ? (
    <p>Loading…</p>
  ) : (
    <ul>
      {data?.people.map((person) => (
        <li key={person.id}>{person.name}</li>
      ))}
    </ul>
  );
}

function App() {
  const [isParentQueryCompleted, setIsParentQueryCompleted] = useState(false);
  const [isChildQueryCompleted, setIsChildQueryCompleted] = useState(false);
  const [showPeopleList, setShowPeopleList] = useState(false);
  useQuery(ALL_PEOPLE, {
    // onCompleted: () => {
    //   setIsParentQueryCompleted(true);
    // },
  });
  const [mutate] = useMutation(ADD_PERSON,{
    variables: {
        name: "test"
    },
    onCompleted: () => {
        console.log("mutate onCompleted called")
        setShowPeopleList(true);
        setIsParentQueryCompleted(true);
    },  
  })
  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <h2>Parent query completed: {String(isParentQueryCompleted)}</h2>
      <h2>Child query completed: {String(isChildQueryCompleted)}</h2>
      <button onClick={() => mutate()}>
        Click me after parent query completed
      </button>
      <h2>Names</h2>
      {showPeopleList && (
        <PeopleList setIsQueryCompleted={setIsChildQueryCompleted} />
      )}
    </main>
  );
}

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
});

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
