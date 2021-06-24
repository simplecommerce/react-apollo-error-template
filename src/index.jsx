/*** SCHEMA ***/
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
} from 'graphql';
const PersonType = new GraphQLObjectType({
  name: 'Person',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
  },
});

const peopleData = [
  { id: 1, name: 'John Smith', gender: 'male' },
  { id: 2, name: 'Sara Smith', gender: 'female' },
  { id: 3, name: 'Budd Deey', gender: 'nonbinary' },
  { id: 4, name: 'Johnny Appleseed', gender: 'male' },
  { id: 5, name: 'Ada Lovelace', gender: 'female' },
];

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    people: {
      type: new GraphQLList(PersonType),
      args: { gender: { type: GraphQLString } },
      resolve: (_, { gender }) => gender === 'all' ? peopleData : peopleData.filter(person => person.gender === gender),
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addPerson: {
      type: PersonType,
      args: { 
        name: { type: GraphQLString },
      },
      resolve: function (_, { name }) {
        const person = {
          id: peopleData[peopleData.length - 1].id + 1,
          name,
        };

        peopleData.push(person);
        return person;
      }
    },
  },
});

export const schema = new GraphQLSchema({ query: QueryType, mutation: MutationType });

/*** LINK ***/
import { graphql, print } from "graphql";
import { ApolloLink, Observable } from "@apollo/client";
function delay(wait) {
  return new Promise(resolve => setTimeout(resolve, wait));
}

const link = new ApolloLink(operation => {
  return new Observable(async observer => {
    const { query, operationName, variables } = operation;
    console.log('Query', operationName, 'request sent to server');
    await delay(500);
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
      console.log('Query', operationName, 'resolved');
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
  gql,
  useQuery,
} from "@apollo/client";
import "./index.css";

const ALL_PEOPLE = gql`
  query AllPeople($gender: String!) {
    people(gender: $gender) {
      id
      name
    }
  }
`;

export default function App() {
  const [gender, setGender] = useState('all');
  const {
    loading,
    data,
  } = useQuery(ALL_PEOPLE, { variables: { gender }, notifyOnNetworkStatusChange: true, fetchPolicy: 'network-only', nextFetchPolicy: 'cache-first' });

  const currentPeopleNames = data?.people?.map(person => person.name);

  const genderRadioHandler = useCallback(event => {
    setGender(event.target.value);
  }, []);

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <input type="radio" name="gender" id="all" value="all" onChange={genderRadioHandler} checked={gender === 'all'} />
      <label htmlFor="all">All</label>
      <input type="radio" name="gender" id="male" value="male" onChange={genderRadioHandler} checked={gender === 'male'} />
      <label htmlFor="male">Male</label>
      <input type="radio" name="gender" id="female" value="female" onChange={genderRadioHandler} checked={gender === 'female'} />
      <label htmlFor="female">Female</label>
      <input type="radio" name="gender" id="nonbinary" value="nonbinary" onChange={genderRadioHandler} checked={gender === 'nonbinary'} />
      <label htmlFor="nonbinary">Nonbinary</label>
      <h2>Names</h2>
        <p style={{ visibility: loading ? 'visible' : 'hidden' }}>Loading…</p>
        <ul>
          {data?.people.map(person => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
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
