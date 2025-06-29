import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

// const WELCOME_MODAL_KEY = 'aidmap_welcome_modal_shown' // Reserved for future use
const USER_WELCOME_KEY_PREFIX = 'aidmap_user_welcome_'

export function useWelcomeModal() {
  const { user } = useAuth()
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  useEffect(() => {
    if (user) {
      const userWelcomeKey = `${USER_WELCOME_KEY_PREFIX}${user.id}`
      const hasSeenWelcome = localStorage.getItem(userWelcomeKey)
      
      // Show welcome modal if user hasn't seen it before
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true)
      }
    }
  }, [user])

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false)
    if (user) {
      const userWelcomeKey = `${USER_WELCOME_KEY_PREFIX}${user.id}`
      localStorage.setItem(userWelcomeKey, 'true')
    }
  }

  const showWelcomeModalManually = () => {
    setShowWelcomeModal(true)
  }

  return {
    showWelcomeModal,
    closeWelcomeModal,
    showWelcomeModalManually
  }
}