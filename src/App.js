import React from "react";
import { gql, useQuery } from "@apollo/client";

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      name
      happinessLevel
    }
  }
`;

export default function App() {
  const {
    loading,
    data,
  } = useQuery(ALL_PEOPLE, {
    pollInterval: 1000,
    // when notifyOnNetworkStatusChange is false, onCompleted only gets called once.
    // changing notifyOnNetworkStatusChange to true causes onCompleted to be called after each successful poll
    notifyOnNetworkStatusChange: false,
    onCompleted: data => {
      console.log('onCompleted was called with this data:', data);
    }
  });


  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <h2>Names</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data?.people.map(person => (
            <li key={person.id}>{person.name}'s happiness level: {person.happinessLevel}%</li>
          ))}
        </ul>
      )}
    </main>
  );
}
