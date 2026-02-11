import { useAuth0 } from '@auth0/auth0-react'

const UserButton: React.FC = () => {
  const { isAuthenticated, loginWithRedirect, user, logout } = useAuth0()

  if (!isAuthenticated || user === undefined) {
    return (
      <>
        <button onClick={() => loginWithRedirect()}>Log in</button>
      </>
    )
  }

  return (
    <>
      <p>Logged in as: {user.email}</p>
      <button
        onClick={() =>
          logout({
            logoutParams: {
              returnTo: window.location.origin,
            },
          })
        }
      >
        logout
      </button>
    </>
  )
}

export default UserButton
