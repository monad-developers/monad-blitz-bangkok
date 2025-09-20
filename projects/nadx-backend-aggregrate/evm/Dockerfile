# Use the latest foundry image
FROM ghcr.io/foundry-rs/foundry

EXPOSE 8545

# Set environment variable for host binding
ENV ANVIL_IP_ADDR=0.0.0.0

CMD ["anvil", "--host", "0.0.0.0", "--port", "8545"]