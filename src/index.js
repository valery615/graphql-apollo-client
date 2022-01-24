import React from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  createHttpLink,
  gql,
  split
} from "@apollo/client";
import { useSubscription } from '@apollo/react-hooks'
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:8080/v1/graphql',
});

const token = localStorage.getItem('token');
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`,
    }
  }
});

const wsLink = new WebSocketLink({
  uri: 'ws://localhost:8080/v1/graphql-ws',
  options: {
    reconnect: true,
    options: {
      connectionParams: {
        authorization: "Bearer asdfasfdasdf"
      }
    }
  }
});


const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

function ExchangeRates() {
  const { loading, error, data } = useQuery(gql`
  {
    gameboard(season: 2021, seasonType: POSTSEASON) {
      games {
        id
      }
    }
  }
  `);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return data.rates.map(({ currency, rate }) => (
    <div key={currency}>
      <p>
        {currency}: {rate}
      </p>
    </div>
  ));
}



function Subscription() {

  const SUBSCRIPTION = gql`
subscription
{
  flowControl(gameId: "CA~MjAyMC9QT1NULzQvNTg1MDE"){
    time
    durationMilliseconds
    events{
      description
      typename
    }
    formation
  }
}
`;
  const { data, loading } = useSubscription(
    SUBSCRIPTION
  );
  if (loading) return <p>Loading...</p>;
  //  if (error) return <p>Error :(</p>;
  return <h4>{!loading && data}</h4>;
}

function App() {
  return (
    <div>
      <h2>My first Apollo app 🚀</h2>
      {/* <ExchangeRates /> */}

      <Subscription />
    </div>
  );
}

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
