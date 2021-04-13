import React, { useState, useCallback } from "react";
import { gql, useQuery } from "@apollo/client";

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
  } = useQuery(ALL_PEOPLE, { variables: { gender }, notifyOnNetworkStatusChange: false, fetchPolicy: 'network-only' });

  const currentPeopleNames = data?.people?.map(person => person.name);
  console.log('gender:', gender, ';', 'current names:', JSON.stringify(currentPeopleNames));

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
