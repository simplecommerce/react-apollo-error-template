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
