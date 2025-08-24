# Correzione per il webhook Stripe
# Sostituire le righe problematiche nel main.py

# Riga 1089 (circa) - Sostituire:
# user_guardian.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription['current_period_end'])

# Con:
if 'current_period_end' in subscription:
    user_guardian.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription['current_period_end'])
else:
    logger.warning(f"current_period_end non trovato per subscription {subscription['id']}")

# Riga 1099 (circa) - Sostituire:
# user_hostgpt.subscription_end_date = datetime.utcfromtimestamp(subscription['current_period_end'])

# Con:
if 'current_period_end' in subscription:
    user_hostgpt.subscription_end_date = datetime.utcfromtimestamp(subscription['current_period_end'])
else:
    logger.warning(f"current_period_end non trovato per subscription {subscription['id']}")

# Riga 1025 (circa) - Sostituire:
# user.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)

# Con:
if hasattr(subscription, 'current_period_end'):
    user.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
else:
    logger.warning(f"current_period_end non trovato per subscription {session['subscription']}")

# Riga 1035 (circa) - Sostituire:
# user.subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)

# Con:
if hasattr(subscription, 'current_period_end'):
    user.subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
else:
    logger.warning(f"current_period_end non trovato per subscription {session['subscription']}")
